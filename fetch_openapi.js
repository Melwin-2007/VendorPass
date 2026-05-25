const url = "https://zzbpemhcccwmdlikztse.supabase.co/rest/v1/?apikey=sb_publishable_-MUUmRMH1bxHgloAEQoiyQ_LPEuVSpI";

fetch(url)
  .then(r => r.json())
  .then(data => {
    const loanOffersDef = data.definitions.loan_offers;
    console.log(JSON.stringify(loanOffersDef, null, 2));
  });
