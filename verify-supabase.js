// Verify Supabase products table works now
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://djhtwpckoeiscjcstupo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaHR3cGNrb2Vpc2NqY3N0dXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDQ5NjEsImV4cCI6MjEwMTc4MDk2MX0.tFucp7xIrMysokxJ_yt7XGzV8BzWczyOMuSu4j_bGIs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  console.log('=== Testing products table ===');

  // 1. Read test
  const { data, count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' });

  if (error) {
    console.log('READ: ERROR');
    console.log('message:', error.message);
    console.log('code:', error.code);
    console.log('hint:', error.hint || '');
  } else {
    console.log('READ: SUCCESS');
    console.log('total rows:', count);
    console.log('rows:', JSON.stringify(data, null, 2));
  }

  // 2. Write test (upsert a temp product, then read it back, then delete)
  console.log('\n=== Testing write (upsert) ===');
  const testRow = {
    id: 999999,
    name: '__TEST_PRODUCT__',
    category: 'Test',
    price: 1,
    description: 'temp test row',
    stock: 1,
    sizes: ['40']
  };
  const { error: upsertErr } = await supabase.from('products').upsert([testRow], { onConflict: 'id' });
  if (upsertErr) {
    console.log('WRITE: ERROR');
    console.log('message:', upsertErr.message);
    console.log('code:', upsertErr.code);
    console.log('hint:', upsertErr.hint || '');
  } else {
    console.log('WRITE: SUCCESS');
    // Read back
    const { data: rb } = await supabase.from('products').select('*').eq('id', 999999);
    console.log('READ BACK:', JSON.stringify(rb));
    // Clean up
    const { error: delErr } = await supabase.from('products').delete().eq('id', 999999);
    console.log('CLEANUP:', delErr ? 'ERROR - ' + delErr.message : 'SUCCESS');
  }
})();
