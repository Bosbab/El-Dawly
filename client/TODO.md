# Fix "Failed to update product" on Edit Piece

## Steps
- [x] 1. Harden `writeProducts()` in server.js with atomic write + retry (fixes OneDrive write failures)
- [x] 2. Add client-side fallback in `handleProductSubmit()` in script.js so edits update in-memory catalog even if API unreachable
- [x] 3. Improve PUT /products/:id error message to reveal underlying cause
- [x] 4. Test the fix
