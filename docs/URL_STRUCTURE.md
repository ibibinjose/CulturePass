# URL Structure

> Last reviewed: May 8, 2026.

This document defines canonical public routes and where legacy remaps must be maintained.

## Canonical Routes

- `/` -> Discover shell
- `/event/[id]`
- `/community/[id]`
- `/artist/[id]`
- `/business/[id]`
- `/venue/[id]`
- `/profile/[id]`
- `/user/[id]`
- `/tickets/[id]`
- `/perks/[id]`

## Legacy Remaps

- `/events/:id` -> `/event/:id`
- `/artists/:id` -> `/artist/:id`
- `/communities/:id` -> `/community/:id`
- `/profiles/:id` -> `/profile/:id`
- `/users/:id` -> `/user/:id`
- `/businesses/:id` -> `/business/:id`

## Sources Of Truth

- `app/+native-intent.tsx` for native and deep-link remaps
- `firebase.json` for hosting rewrites
- Expo Router route files in `app/`
- Route smoke coverage in repo test scripts

## Guardrails

- Never remove a legacy alias without updating remaps and smoke coverage together.
- Never document legacy aliases as canonical app routes.
- If a new public route is introduced, add it here in the same change.
