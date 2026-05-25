const url = "https://zzbpemhcccwmdlikztse.supabase.co/rest/v1/loan_offers?select=*,profiles!loan_offers_vendor_id_fkey(name,selfie,score)&limit=1";
const key = "sb_publishable_-MUUmRMH1bxHgloAEQoiyQ_LPEuVSpI";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  }
}).then(r => r.json()).then(data => {
  console.log("TEST 1 (fkey):", JSON.stringify(data, null, 2));
  
  const url2 = "https://zzbpemhcccwmdlikztse.supabase.co/rest/v1/loan_offers?select=*,profiles:profiles!vendor_id(name,selfie,score)&limit=1";
  return fetch(url2, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
}).then(r => r.json()).then(data => {
  console.log("TEST 2 (vendor_id):", JSON.stringify(data, null, 2));
});
