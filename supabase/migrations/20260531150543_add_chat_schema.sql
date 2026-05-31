-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  archived_by_vendor BOOLEAN DEFAULT FALSE NOT NULL,
  archived_by_lender BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (vendor_id, lender_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  message_type TEXT CHECK (message_type IN ('TEXT', 'LOAN_APPROVED', 'EMI_REMINDER', 'PAYMENT_RECEIVED', 'OVERDUE_ALERT', 'COUNTER_OFFER', 'LOAN_APPLICATION', 'SYSTEM')) DEFAULT 'TEXT' NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create chat_flags table
CREATE TABLE IF NOT EXISTS public.chat_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT CHECK (reason IN ('SUSPICIOUS', 'NON_RESPONSIVE', 'FRAUD', 'OTHER')) NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'ESCALATED', 'RESOLVED')) DEFAULT 'PENDING' NOT NULL,
  details TEXT,
  timeline JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (chat_id)
);

-- Expose tables to data API
GRANT ALL ON TABLE public.chats TO anon, authenticated;
GRANT ALL ON TABLE public.messages TO anon, authenticated;
GRANT ALL ON TABLE public.chat_flags TO anon, authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_flags ENABLE ROW LEVEL SECURITY;

-- Chats Policies
DROP POLICY IF EXISTS "Allow users to manage their own chats" ON public.chats;
CREATE POLICY "Allow users to manage their own chats"
ON public.chats
FOR ALL
TO authenticated
USING (auth.uid() = vendor_id OR auth.uid() = lender_id)
WITH CHECK (auth.uid() = vendor_id OR auth.uid() = lender_id);

-- Messages Policies
DROP POLICY IF EXISTS "Allow participants to read messages" ON public.messages;
CREATE POLICY "Allow participants to read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chats c 
    WHERE c.id = chat_id 
    AND (c.vendor_id = auth.uid() OR c.lender_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Allow participants to insert messages" ON public.messages;
CREATE POLICY "Allow participants to insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chats c 
    WHERE c.id = chat_id 
    AND (c.vendor_id = auth.uid() OR c.lender_id = auth.uid())
  ) 
  AND sender_id = auth.uid()
);

-- Chat Flags Policies
DROP POLICY IF EXISTS "Allow reporters and lenders to manage flags" ON public.chat_flags;
CREATE POLICY "Allow reporters and lenders to manage flags"
ON public.chat_flags
FOR ALL
TO authenticated
USING (
  reporter_id = auth.uid() OR 
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('LENDER', 'BANK')
)
WITH CHECK (
  reporter_id = auth.uid() OR 
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('LENDER', 'BANK')
);

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_flags;

-- Create trigger function to sync loan offers to the chat stream
CREATE OR REPLACE FUNCTION public.handle_loan_offer_chat_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  chat_uuid UUID;
  lender_profile RECORD;
  vendor_profile RECORD;
  msg_content TEXT;
  msg_type TEXT;
  msg_meta JSONB;
BEGIN
  -- 1. Ensure chat exists between vendor and lender
  INSERT INTO public.chats (vendor_id, lender_id)
  VALUES (NEW.vendor_id, NEW.lender_id)
  ON CONFLICT (vendor_id, lender_id) DO UPDATE
  SET created_at = public.chats.created_at
  RETURNING id INTO chat_uuid;

  SELECT name, selfie, score FROM public.profiles WHERE id = NEW.lender_id INTO lender_profile;
  SELECT name, selfie, score, trust_score_data FROM public.profiles WHERE id = NEW.vendor_id INTO vendor_profile;

  -- 2. Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status = 'PENDING') THEN
      IF (NEW.created_by = 'LENDER') THEN
        msg_type := 'COUNTER_OFFER';
        msg_meta := jsonb_build_object(
          'loan_offer_id', NEW.id,
          'amount', NEW.amount,
          'interest_rate', NEW.interest_rate,
          'tenure', NEW.tenure,
          'created_by', 'LENDER'
        );
        msg_content := 'New loan offer counter: ₹' || NEW.amount || ' at ' || NEW.interest_rate || '% interest for ' || NEW.tenure;
      ELSE
        msg_type := 'LOAN_APPLICATION';
        msg_meta := jsonb_build_object(
          'loan_offer_id', NEW.id,
          'amount', NEW.amount,
          'interest_rate', NEW.interest_rate,
          'tenure', NEW.tenure,
          'vendor_name', coalesce(vendor_profile.name, 'Vendor'),
          'vendor_selfie', coalesce(vendor_profile.selfie, ''),
          'vendor_score', coalesce(vendor_profile.score, 620),
          'created_by', 'VENDOR'
        );
        msg_content := 'Requested a loan of ₹' || NEW.amount;
      END IF;

      INSERT INTO public.messages (chat_id, sender_id, content, message_type, metadata)
      VALUES (chat_uuid, NEW.lender_id, msg_content, msg_type, msg_meta);
    END IF;

  -- 3. Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status <> NEW.status) THEN
      IF (NEW.status = 'ACCEPTED') THEN
        INSERT INTO public.messages (chat_id, sender_id, content, message_type, metadata)
        VALUES (
          chat_uuid,
          NEW.lender_id,
          'Loan Approved: ₹' || NEW.amount,
          'LOAN_APPROVED',
          jsonb_build_object(
            'loan_offer_id', NEW.id,
            'amount', NEW.amount,
            'tenure', NEW.tenure,
            'interest_rate', NEW.interest_rate
          )
        );

        INSERT INTO public.messages (chat_id, sender_id, content, message_type)
        VALUES (
          chat_uuid,
          NEW.lender_id,
          'Loan disbursed on ' || to_char(now(), 'DD Month YYYY'),
          'SYSTEM'
        );

      ELSIF (NEW.status = 'DECLINED') THEN
        INSERT INTO public.messages (chat_id, sender_id, content, message_type)
        VALUES (
          chat_uuid,
          NEW.lender_id,
          'Offer declined',
          'SYSTEM'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_loan_offer_chat_sync ON public.loan_offers;
CREATE TRIGGER trigger_loan_offer_chat_sync
AFTER INSERT OR UPDATE ON public.loan_offers
FOR EACH ROW EXECUTE FUNCTION public.handle_loan_offer_chat_sync();
