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
      .select('id, name, created_at, score, trust_score_data')
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

1. Feature Engineering: Extract Income Signals, Expense Discipline, Business Regularity, Digital Behavior, and Risk Signals.
2. TrustScore Calculation (0-850): Weighted sum of Income Stability (25%), Cash Flow Health (20%), Business Regularity (20%), Payment Discipline (15%), Digital Adoption (10%), and Risk Signals (10%).
3. Default Probability Calculation: Estimate likelihood of non-repayment based on stress signals.
4. Risk Tier Classification: Map score to Platinum, Gold, Silver, Bronze, or Unrated.
5. Output structured JSON exactly matching the schema below.
6. Score Improvement Recommendations & Mistakes to Avoid: Provide 3 actionable tips and 3 mistakes to avoid.

### ⚠️ Accelerated Demo Timeline (CRITICAL)
For all logic, trend analysis, and time-based penalties, you MUST assume the application's accelerated physics engine is active: **5 real-world minutes equals 1 in-app month**.
If you see timestamps showing 5 minutes of inactivity between EMI payments or transactions, treat that as a vendor missing an entire month's payment and apply severe penalties accordingly. All monthly metrics must be scaled to this 5-minute window. Do not penalize them for "all activity happening in 3 days" because 3 days in real-world time equals over 2 years of in-app time.

EXPECTED JSON SCHEMA:
{
  "vendor_id": "V-00123",
  "score_date": "2026-05-23",
  "trust_score": 23,
  "risk_tier": "Critical",
  "classification_badge": "HIGH RISK — DO NOT ONBOARD",
  "default_probability": "92%",
  "recommended_loan_limit": "₹0",
  "recommended_interest_band": "N/A",
  "repayment_frequency_suggestion": "N/A",
  "pillar_scores": {
    "income_stability": 25,
    "cash_flow_health": 18,
    "business_regularity": 30,
    "payment_discipline": 35,
    "digital_adoption": 20,
    "risk_signals": 15
  },
  "score_explanation": "Short summary...",
  "key_findings": {
    "financial_integrity": [
      "There is no identifiable genuine business income.",
      "Credits are dominated by loan disbursements."
    ],
    "behavioral_indicators": [
      "All transactions occur across just 3 days with no historical pattern.",
      "Counterparty names include 'robbery', 'gambling', 'loss'."
    ],
    "compliance_gaps": [
      "Zero utility payments, zero supplier invoices.",
      "No category tagging anywhere."
    ]
  },
  "risk_signals_table": [
    {
      "signal": "Suspicious Counterparties",
      "evidence": "'robbery', 'gambling', 'easy money lol'",
      "severity": "Critical"
    },
    {
      "signal": "Loan Stacking",
      "evidence": "Multiple EMI transactions across different months",
      "severity": "High"
    }
  ],
  "final_recommendation": "Application Declined — Refer to Financial Intelligence Unit for further review."
}

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

    // Preserve existing history if any
    const existingTrustScoreData = (profile as any).trust_score_data || {};
    const existingHistory = Array.isArray(existingTrustScoreData.history) ? existingTrustScoreData.history : [];
    
    // Check if score changed to add to history
    const oldScore = existingTrustScoreData.trust_score || (profile as any).score || 620;
    const newScore = parsedTrustScoreData.trust_score;
    const scoreDiff = newScore - oldScore;
    
    let history = [...existingHistory];
    if (scoreDiff !== 0) {
      history.unshift({
        timestamp: new Date().toISOString(),
        score_change: scoreDiff,
        narrative: parsedTrustScoreData.score_explanation || `TrustScore updated based on recent wallet transactions.`,
        type: scoreDiff > 0 ? 'reward' : 'penalty'
      });
    }
    
    const finalTrustScoreData = {
      ...parsedTrustScoreData,
      history: history
    };

    // Update the profile with the new trust score data and the score column
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        score: newScore,
        trust_score_data: finalTrustScoreData 
      })
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
