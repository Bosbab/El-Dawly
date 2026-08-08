// Direct REST test - most reliable way to diagnose PGRST205
const url = 'https://djhtwpckoeiscjcstupo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaHR3cGNrb2Vpc2NqY3N0dXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDQ5NjEsImV4cCI6MjEwMTc4MDk2MX0.tFucp7xIrMysokxJ_yt7XGzV8BzWczyOMuSu4j_bGIs';

const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json'
};

(async () => {
  // 1. Try /rest/v1/products with a minimal query
  console.log('=== 1. GET /rest/v1/products?select=id&limit=1 ===');
  let r = await fetch(`${url}/rest/v1/products?select=id&limit=1`, { headers });
  console.log('Status:', r.status);
  console.log(await r.text());
  console.log('');

  // 2. Try a different table name - is auth.users accessible? (tests if API works at all)
  console.log('=== 2. OPTIONS /rest/v1/products (CORS preflight) ===');
  r = await fetch(`${url}/rest/v1/products?select=id&limit=1`, { method: 'OPTIONS', headers });
  console.log('Status:', r.status);
  console.log(await r.text());
})();
