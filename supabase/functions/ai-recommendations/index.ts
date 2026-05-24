import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lender_id } = await req.json();

    if (!lender_id) {
      return new Response(
        JSON.stringify({ error: 'lender_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Mock AI recommendation logic.
    // In a real scenario, this would query a vector DB or an ML model
    // based on the lender's past accepted loan offers and preferences.
    const recommendations = [
      { vendor_id: 'mock-vendor-id-1', score: 98, reason: 'High repayment probability in Retail.' },
      { vendor_id: 'mock-vendor-id-2', score: 85, reason: 'Matches your preferred ticket size.' }
    ];

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
