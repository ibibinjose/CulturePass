## What
<!-- One sentence: what does this PR do? -->

## Why
<!-- Why is this change needed? Link to issue if applicable. -->

## How
<!-- Brief explanation of the approach. Skip for trivial changes. -->

## Test plan
- [ ] Ran `npm run typecheck` — no errors
- [ ] Ran `npm run lint` — no warnings
- [ ] Tested on iOS simulator / Android emulator / Web
- [ ] No regressions on adjacent screens

## Screenshots / recordings
<!-- Required for any UI change. Delete if N/A. -->

## Checklist
- [ ] No `.env` or secrets committed
- [ ] Design tokens used (no hardcoded hex or raw px values)
- [ ] API calls go through `lib/api.ts` — no direct Firestore reads in components
- [ ] No `console.log` left in production paths

## Architecture / Significant Changes
<!-- If this PR touches architecture, data models, major flows (HostSpace, payments, admin, auth, verification), or introduces new patterns: -->
- [ ] This change is covered by an ADR in `docs/ADRs/`
- ADR reference (if applicable): 

<!-- Example: "See ADR-001: Host Creation Unification" -->
