const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Extract supabase URL and Key from .env or just use the ones from the app
const envPath = path.join(__dirname, '.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envFile.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envFile.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseKey = keyMatch[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.log("Could not find Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDb() {
  console.log("Fetching accepted loan offers...");
  const { data: offers, error: offersErr } = await supabase
    .from('loan_offers')
    .select('vendor_id, created_at')
    .eq('status', 'ACCEPTED');
    
  if (offersErr) {
    console.error(offersErr);
    return;
  }
  
  console.log(`Found ${offers.length} accepted offers.`);
  
  const { data: requests, error: reqErr } = await supabase
    .from('public_loan_requests')
    .select('id, vendor_id, created_at')
    .eq('status', 'PENDING');
    
  if (reqErr) {
    console.error(reqErr);
    return;
  }
  
  console.log(`Found ${requests.length} pending requests.`);
  
  let fixedCount = 0;
  for (const req of requests) {
    // If the vendor has an accepted offer that was created ON OR AFTER the request, 
    // it means the request was fulfilled.
    const reqTime = new Date(req.created_at).getTime();
    const hasFulfillingOffer = offers.some(o => o.vendor_id === req.vendor_id && new Date(o.created_at).getTime() >= reqTime - 10000);
    
    if (hasFulfillingOffer) {
      console.log(`Fixing request ${req.id} for vendor ${req.vendor_id}`);
      const { error } = await supabase
        .from('public_loan_requests')
        .update({ status: 'FULFILLED' })
        .eq('id', req.id);
        
      if (error) console.error(error);
      else fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} requests.`);
}

fixDb();
