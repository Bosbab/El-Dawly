// Direct REST test against Supabase to diagnose the PGRST205 error
// This checks if the products table is visible via the PostgREST API

const SUPABASE_URL = 'https://djhtwpckoeiscjcstupo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaHR3cGNrb2Vpc2NqY3N0dXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDQ5NjEsImV4cCI6MjEwMTc4MDk2MX0.tFucp7xIrMysokxJ_yt7XGzV8BzWczyOMuSu4j_bGIs';

(async () => {
  // Try the actual products table endpoint via anon key
  console.log('=== GET /rest/v1/products?select=id&limit=1 ===');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text.slice(0, 2000));
})();
