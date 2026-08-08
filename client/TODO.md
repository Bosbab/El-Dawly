# Persistent Product Storage via Supabase (Vercel)

Root cause: Vercel serverless filesystem is read-only/ephemeral, so edits to products.json don't persist globally.

## Steps
- [x] 1. Install @supabase/supabase-js
- [ ] 2. Create Supabase `products` table (SQL provided to user) - PENDING USER ACTION
- [x] 3. Add Supabase env vars to .env.example
- [x] 4. Rewrite server.js readProducts/writeProducts to use Supabase
- [x] 5. Update product routes (GET/POST/PUT/DELETE) to use Supabase
- [ ] 6. Test locally (after table is created)
- [ ] 7. Deploy / verify on Vercel
