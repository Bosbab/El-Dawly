# EL Dawly Fix Tasks

## Task 1: Fix 404 on order placement (server-side) — ✅ DONE
- [x] Ensure `data/` dir and `orders.json`/`messages.json` exist on startup
- [x] Add API 404 handler so unknown API routes return JSON, not HTML
- [x] Keep SPA catch-all only for non-API GET requests

## Task 2: Harden order submission (client-side) — ✅ DONE
- [x] Make order success path robust (WhatsApp popup failure shouldn't block)
- [x] Fix bug where WhatsApp check used reset `checkoutData.payment` instead of `orderData.paymentMethod`
- [x] Add clearer error handling / toasts

## Task 3: Realistic rotating Earth logo — ✅ DONE
- [x] Created realistic Earth SVG (`client/images/earth-map.svg`) with real continents, oceans, deserts, ice caps
- [x] Updated navbar logo and hero globe to use the realistic Earth map
- [x] Kept rotation animation

## Cleanup
- [x] Leave temporary diagnostic files (diagnose.js, run-diagnose.cmd, test-order.cjs, verify.js, cleanup-temp.cmd) for manual removal if desired

## Verify
- [ ] User runs `npm start` and tests order flow
- [ ] Confirm realistic Earth renders properly
