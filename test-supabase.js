// Quick test of Supabase connection for EL Dawly
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://djhtwpckoeiscjcstupo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaHR3cGNrb2Vpc2NqY3N0dXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDQ5NjEsImV4cCI6MjEwMTc4MDk2MX0.tFucp7xIrMysokxJ_yt7XGzV8BzWczyOMuSu4j_bGIs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  console.log('Testing Supabase connection...');
  const { data, count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .limit(3);

  if (error) {
    console.log('RESULT: ERROR');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Hint:', error.hint || '');
    // Common: table not found, or RLS blocking
  } else {
    console.log('RESULT: SUCCESS');
    console.log('Count:', count);
    console.log('Sample rows:', JSON.stringify(data, null, 2));
  }
})();
