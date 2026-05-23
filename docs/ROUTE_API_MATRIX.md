# Route to API Matrix

> Last reviewed: May 8, 2026.

This document maps canonical app routes to their primary backend dependencies. Keep this file aligned with `functions/src/app.ts` and avoid duplicating legacy aliases here.

| Route | Primary endpoint(s) |
|---|---|
| `/`, `/(tabs)/index`, `/allevents`, `/map`, `/search` | `GET /api/events`, `GET /api/communities`, `GET /api/discover/:userId`, `GET /api/search`, `GET /api/search/suggest`, `GET /api/indigenous/traditional-lands` |
| `/event/[id]` | `GET /api/events/:id`, `POST /api/tickets`, `POST /api/stripe/create-checkout-session`, `GET /api/ticket/:id` |
| `/community/[id]`, `/business/[id]`, `/artist/[id]`, `/venue/[id]`, `/profile/[id]` | `GET /api/profiles/:id`, `GET /api/communities/:id`, `GET /api/businesses/:id`, `GET /api/reviews/:profileId`, `GET /api/events` |
| `/tickets`, `/tickets/[id]`, `/tickets/print/[id]` | `GET /api/tickets/:userId`, `GET /api/tickets/:userId/count`, `GET /api/ticket/:id`, `GET /api/tickets/:id/history`, `PUT /api/tickets/:id/cancel`, `GET /api/tickets/:id/wallet/apple`, `GET /api/tickets/:id/wallet/google` |
| `/payment/wallet`, `/payment/methods`, `/payment/transactions` | `GET /api/wallet/:userId`, `POST /api/wallet/:userId/topup`, `GET /api/payment-methods/:userId`, `POST /api/payment-methods`, `DELETE /api/payment-methods/:id`, `PUT /api/payment-methods/:userId/default/:methodId`, `GET /api/transactions/:userId` |
| `/perks`, `/perks/[id]`, `/(tabs)/perks` | `GET /api/perks`, `GET /api/perks/:id`, `POST /api/perks/:id/redeem`, `GET /api/membership/:userId`, `GET /api/redemptions` |
| `/notifications` | `GET /api/notifications/:userId`, `GET /api/notifications/:userId/unread-count`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/:userId/read-all`, `DELETE /api/notifications/:id` |
| `/profile/edit`, `/(tabs)/profile`, `/user/[id]`, `/contacts/[cpid]` | `GET /api/auth/me`, `GET /api/users/:id`, `PUT /api/users/:id`, `GET /api/cpid/lookup/:cpid`, `GET /api/wallet/:userId` |
| `/membership/upgrade` | `GET /api/membership/member-count`, `POST /api/membership/subscribe`, `POST /api/membership/cancel-subscription` |
| `/scanner` | `POST /api/tickets/scan`, `GET /api/cpid/lookup/:cpid`, `GET /api/users/:id`, `GET /api/tickets/admin/scan-events` |
| `/submit` | `POST /api/profiles`, `POST /api/perks`, `POST /api/uploads/image`, `POST /api/media/attach` |
| `/council/*`, `/(tabs)/council` | `GET /api/council/*`, `POST /api/council/:id/claim`, `POST /api/council/:id/follow`, `PUT /api/council/:id/preferences`, `PUT /api/council/:id/waste-reminder` |

## Notes

- Canonical route behavior and legacy remaps belong in `docs/URL_STRUCTURE.md`.
- The live route handlers are implemented in `functions/src/app.ts`.
- If a route is added or removed, update this file in the same change as the router or backend handler.
