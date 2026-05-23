import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get the payload from the webhook
    const payload = await req.json();
    const newTransaction = payload.record;

    if (!newTransaction || !newTransaction.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const userId = newTransaction.user_id;

    // Fetch the last 6 months of transactions for this user
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('date:created_at, type, amount, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (txError) throw txError;

    // Fetch the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Calculate account age in months
    const accountAgeMs = Date.now() - new Date(profile.created_at).getTime();
    const accountAgeMonths = Math.max(1, Math.floor(accountAgeMs / (1000 * 60 * 60 * 24 * 30)));

    // Prepare JSON payload for the AI model based on TRUSTSCORE_ENGINE_PROMPT
    const vendorData = {
      vendor_id: userId,
      period: "recent",
      transactions: transactions.map(tx => ({
        date: tx.date.split('T')[0],
        type: tx.type === 'ADD' ? 'credit' : 'debit',
        amount: Number(tx.amount),
        channel: 'wallet',
        counterparty: tx.description,
        category: 'unknown'
      })),
      utility_payments: [],
      supplier_invoices: [],
      mobile_recharges: { frequency_per_month: 0, prepaid_or_postpaid: 'unknown' },
      upi_apps_used: ["VendorPASS Wallet"],
      account_age_months: accountAgeMonths,
      avg_monthly_balance: 0, // Simplified for now
      known_loan_history: []
    };

    const systemPrompt = `You are VendorPASS TrustScore Engine v1. Given the transaction data provided, perform all 6 steps of the TrustScore methodology:
1. Feature Engineering
2. TrustScore Calculation (0-850)
3. Default Probability Calculation
4. Risk Tier Classification
5. Output structured JSON
6. Score Improvement Recommendations

Calculate the TrustScore™ on a 0-850 scale, estimate default probability, classify the risk tier, and return ONLY a JSON object that matches the requested schema exactly. Be conservative — when data is ambiguous, assume moderate risk. Explain every score in plain language a non-finance person can understand.
DO NOT wrap the JSON in markdown code blocks. Return ONLY raw valid JSON.`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/owl-alpha',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(vendorData, null, 2) }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const aiResult = await response.json();
    let trustScoreDataRaw = aiResult.choices[0].message.content;
    
    // Clean up potential markdown formatting if model ignores instruction
    if (trustScoreDataRaw.startsWith('```json')) {
      trustScoreDataRaw = trustScoreDataRaw.replace(/```json\n?/, '').replace(/```\n?$/, '');
    }

    let parsedTrustScoreData;
    try {
      parsedTrustScoreData = JSON.parse(trustScoreDataRaw);
    } catch (e) {
      console.error("Failed to parse AI response as JSON", trustScoreDataRaw);
      throw new Error("Invalid JSON from AI model");
    }

    // Update the profile with the new trust score data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ trust_score_data: parsedTrustScoreData })
      .eq('id', userId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, parsedTrustScoreData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
