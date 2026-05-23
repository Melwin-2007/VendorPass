import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzbpemhcccwmdlikztse.supabase.co';
const supabaseAnonKey = 'sb_publishable_-MUUmRMH1bxHgloAEQoiyQ_LPEuVSpI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTrustScore() {
  const dummyEmail = `testuser_${Date.now()}@example.com`;
  const dummyPassword = 'TestPassword123!';

  console.log(`Signing up dummy user: ${dummyEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: dummyEmail,
    password: dummyPassword,
  });

  if (authError || !authData.user) {
    console.error('Error signing up user:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log(`User created with ID: ${userId}`);
  
  // Wait a moment for any auth triggers to create the profile
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Inserting dummy transaction...');
  const { data: transaction, error: txError } = await supabase
    .from('wallet_transactions')
    .insert([
      {
        user_id: userId,
        amount: 500,
        type: 'ADD',
        description: 'Dummy transaction for TrustScore test',
        // created_at will usually default to now()
      }
    ])
    .select()
    .single();

  if (txError) {
    console.error('Error inserting transaction. RLS might be blocking this anon request without a session:', txError.message);
    // Cleanup the auth user maybe? But we can't easily delete auth users without service key
    return;
  }

  console.log('Transaction inserted successfully:', transaction.id);
  console.log('Waiting 10 seconds for the webhook and Edge Function to process...');

  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('Checking profile for updated trust score data...');
  const { data: updatedProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('trust_score_data')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching updated profile:', fetchError);
    return;
  }

  if (updatedProfile.trust_score_data) {
    console.log('✅ Success! Trust score data found:');
    console.log(JSON.stringify(updatedProfile.trust_score_data, null, 2));
  } else {
    console.log('❌ No trust score data found. The function might have failed, is still running, or webhook is not firing.');
  }
}

testTrustScore();
