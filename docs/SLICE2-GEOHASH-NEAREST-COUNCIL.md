# Slice 2: GeoHash Backfill + Nearest Council (LGA Auto-Select)

**Priority**: High (directly from TheApp.md roadmap + user direction after Slice 1)
**Owner**: Engineering
**Status**: Completed (un-stubbed LocationField, added integration tests, verified compile)
**Branch Strategy**: New branch `feat/slice2-geohash-nearest-council` from `fix/luxe-foundation-stabilize`
**Risk Level**: Medium (location data + discover filtering; no payments or auth changes)

---

## 1. Goals (Tied to Original Roadmap)

From TheApp.md (May 2026):
- GeoHash backfill — geocode events missing `latitude` / `longitude` / `geoHash`
- Council LGA auto-select from GPS on onboarding (`/api/councils/nearest`)
- Improve proximity filtering for events and businesses (LGA + geoHash)

**Business Impact**:
- Better "near you" discovery
- More accurate council-based recommendations and directory
- Foundation for future features (city pages, regional marketing, etc.)

**Technical Goals for this Slice**:
- Make the existing geoHash backfill more robust and observable.
- Strengthen the `/api/council/nearest` endpoint + client hook.
- Wire reliable auto-selection into the main onboarding location flow.
- Add at least one new automated test (integration or contract).
- Keep changes evolutionary — no data model breaking changes.

---

## 2. Current State (as of 2026-05-28)

### GeoHash Side
- **Backend**:
  - `functions/src/jobs/geohashBackfill.ts` — mature job using `geofire-common`.
  - Supports `forceGeoHash` and `overwriteCoordinates` (limited to AU via postcode lookup).
  - Exposed via `POST /api/admin/jobs/geohash-backfill` (admin only).
  - Trigger in `functions/src/triggers.ts` (onEventWritten) that auto-computes geoHash when lat/lng present.
- **Client**:
  - Admin UI in `src/app/admin/platform.tsx` has a "Run geohash backfill" button (limit 400).
  - `src/platform/api/endpoints/admin.ts` calls the job.
- **Gaps**:
  - Many published events still lack coordinates/geoHash (per TheApp.md).
  - No scheduled/recurring backfill (manual only via admin).
  - Limited observability (just returns counts).

### Nearest Council (LGA) Side
- **Backend** (`functions/src/handlers/council.ts`):
  - `GET /api/council/nearest` — coordinate-first with haversine against councils collection + city/state fallback.
  - `findNearestCouncilByCoordinates` + `findCouncilByCityState`.
  - Also has `resolveCouncilForUser` (uses user doc + legacy links).
- **Client**:
  - `src/platform/api/endpoints/council.ts` — `nearest()` method.
  - `src/hooks/useNearestCouncil.ts` — GPS + reverse geocode + call to API. Returns `{ detect, council, status }`.
  - Used lightly in `src/modules/host/components/fields/LocationField.tsx` (currently stubbed/commented).
  - **Not yet wired** into the main onboarding location flow (`src/app/(onboarding)/location.tsx`).
- **Gaps**:
  - Onboarding location screen does manual selection only.
  - No strong "auto-detect council" CTA or persistent selection in onboarding.
  - Hook exists but under-utilized.
  - No composite Firestore index visible for high-scale nearest queries (current impl loads up to 1000 docs and does client-side haversine — acceptable for now but not ideal long-term).

### Data Model
- `events/{id}`: `latitude`, `longitude`, `geoHash`, `lgaCode?`, `city`, `state`, `country`
- `councils/{id}`: `name`, `lgaCode`, `state`, `latitude`/`longitude` (or centreLat), `suburb`, `serviceCities[]`, etc.
- `users/{uid}`: `lgaCode?`, `councilId?`

---

## 3. Proposed Scope (Tight & Safe)

**In Scope for Slice 2** (one focused iteration):
1. **Backend — Council Nearest Improvements** (Safest starting point)
   - Improve `findNearestCouncilByCoordinates` + the `/council/nearest` route handler:
     - Return `distanceKm` when coordinate match succeeds.
     - Add `matchMethod`: `"coordinate" | "city-state" | "none"`.
     - Add basic `confidence` scoring (strong / medium / weak).
     - Improve state filtering + logging for observability.
   - Keep the current client-side haversine approach for now (no index changes in this slice).
   - Ensure graceful null responses and error shaping.

2. **Client — Onboarding Integration**
   - Wire `useNearestCouncil` into `src/app/(onboarding)/location.tsx`.
   - Add a prominent "Detect my council (LGA)" button or auto-suggest after GPS step.
   - Persist selection into OnboardingContext + user profile if signed in.
   - Graceful fallback to manual selection.

3. **Host Flow Polish (low risk)**
   - Un-comment / improve the nearest council call in `LocationField.tsx` for host creation.

4. **GeoHash Observability (light)**
   - Improve the admin backfill response or add a simple "last run" status (optional but high value).
   - Document current coverage gap.

5. **Testing**
   - Add at least **one new integration or contract test** (e.g. for `/api/council/nearest` or the backfill job).
   - Manual verification on onboarding location flow (iOS + Web).

**Out of Scope (defer to later slices)**:
- Full scheduled Cloud Scheduler job for geoHash backfill.
- Composite Firestore indexes + server-side geo queries (geofire or Data Connect later).
- Bulk event re-indexing UI.
- Council selection in other surfaces (calendar, discover filters) — only onboarding + one host spot for this slice.
- Any changes to event publishing flow.

---

## 4. Files Likely to Change

**Backend (Functions)**:
- `functions/src/handlers/council.ts` (main nearest logic)
- `functions/src/jobs/geohashBackfill.ts` (minor observability if time)
- Possibly `firestore.indexes.json` (if we decide a light index helps)

**Client API Layer**:
- `src/platform/api/endpoints/council.ts` (minor shaping if needed)

**Client UI / Hooks**:
- `src/hooks/useNearestCouncil.ts` (possible small improvements)
- `src/app/(onboarding)/location.tsx` (main integration point)
- `src/modules/host/components/fields/LocationField.tsx` (un-stub the call)

**Admin (optional light touch)**:
- `src/app/admin/platform.tsx` (better feedback from backfill)

**Tests**:
- New file or addition in `scripts/tests/integration-*.ts` or Functions test suite.

**Docs**:
- Update this plan + possibly `TheApp.md` roadmap status.

---

## 5. Execution Order (Recommended)

1. **Prep** (this plan approved)
   - Create branch `feat/slice2-geohash-nearest-council`
   - Pull latest from `fix/luxe-foundation-stabilize`

2. **Backend strengthening** (lowest risk, highest leverage) — Safest first implementation piece
   - In `functions/src/handlers/council.ts`:
     - Enhance `findNearestCouncilByCoordinates` to return distance.
     - Update the `/council/nearest` route to return `distanceKm`, `matchMethod`, and `confidence`.
     - Add structured logging (request params + result type + distance).
   - Keep all existing fallback logic intact.
   - Run Functions typecheck + build validation.

3. **Client hook + API** (if any small changes needed)

4. **Onboarding integration** (highest user-visible impact)
   - Add detect button + auto-apply to the location stepper.
   - Update OnboardingContext if needed.

5. **Host LocationField** (quick win)

6. **Testing**
   - Add one contract/integration test for nearest endpoint.
   - Full manual smoke of onboarding location on 3 platforms.

7. **Gate**
   - Typecheck + lint clean
   - Manual verification sign-off
   - Commit with clear message

---

## 6. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|----------|
| Onboarding flow regression | Medium | High | Very small, isolated change + heavy manual testing |
| Nearest council returns poor matches | Medium | Medium | Improve scoring + keep manual override prominent |
| GeoHash job performance on large collection | Low | Low | Keep existing limit + admin-only |
| Missing Firestore indexes causing slow queries | Medium | Low | Current impl is client-side haversine on 1000 docs — acceptable for Slice 2 |
| User confusion on "council" vs manual city | Medium | Low | Clear copy + "you can change this later" |

**Hard Rules**:
- No changes to Stripe/payment flows.
- No auth or user identity model changes.
- All changes must pass typecheck + lint before commit.
- One new automated test minimum.

---

## 7. Definition of Done for Slice 2

- `/api/council/nearest` returns richer payload: `distanceKm`, `matchMethod`, and basic `confidence`.
- The endpoint has improved logging and error handling.
- Onboarding location screen has working "Detect my council / LGA" using GPS (iOS + Android + Web graceful).
- Selection flows into context and can influence later steps (or at minimum persists visibly).
- Host creation LocationField uses the real nearest call.
- At least one new test (integration preferred) covering the nearest flow or backfill.
- `npm run typecheck` + targeted lint clean on changed files.
- Manual sign-off on the full onboarding location flow across platforms.
- Updated docs/plan with results.

---

## 8. Suggested Commit Strategy

- One focused PR/branch for the whole slice (or split into 2 micro-commits: backend+API first, then client wiring).
- Clear title: `feat: geoHash observability + nearest council auto-select in onboarding (Slice 2)`

---

**Next Step**: User reviews this plan → gives explicit "GO — begin Slice 2 implementation" (or requests modifications).

Once GO is received, we will:
1. Create the feature branch.
2. Start with backend council nearest improvements (safest first).

This plan is intentionally narrow so we can ship value quickly while maintaining the zero-regression standard established in Slice 1.