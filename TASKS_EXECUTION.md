# CulturePass Execution Board

Last updated: 2026-04-23

Status keys:
- `Done` = completed and verified
- `In Progress` = actively being worked
- `Planned` = approved, not started
- `Blocked` = waiting on dependency/decision

## Completed (Verified)

| ID | Task | Priority | Status | Verified In |
|---|---|---|---|---|
| C-001 | Discover header quick theme toggle | P2 | Done | `components/Discover/DiscoverHeader.tsx` |
| C-002 | Discover category rail wired to backend counts | P1 | Done | `functions/src/handlers/search.ts`, `lib/api.ts`, `components/Discover/CategoryRail.tsx` |
| C-003 | Browse category empty state UX refresh | P2 | Done | `components/browse/BrowseLayout.tsx` |
| C-004 | Event rail card spacing/pricing chip polish | P2 | Done | `components/Discover/EventCard.tsx` |
| C-005 | About hero color/contrast pass | P2 | Done | `src/app/about.tsx` |

## Active Delivery Queue

| ID | Task | Priority | Owner | Status | ETA | Target Date | Dependencies | Notes |
|---|---|---|---|---|---|---|---|---|
| P0-001 | Fix `/contacts` route integrity | P0 | FE | In Progress | 1d | 2026-04-24 | Route map check | Referenced from scanner/profile flows. |
| P0-002 | Fix `/membership/upgrade` route integrity | P0 | FE | Planned | 1d | 2026-04-24 | Route map check | Referenced by UI; route missing on current main. |
| P0-003 | Validate perks route consistency (`/(tabs)/perks`) | P0 | FE | Planned | 0.5d | 2026-04-24 | Route map check | Ensure all pushes match actual route. |
| P0-004 | Add route integrity CI check | P0 | FE/DevEx | In Progress | 1d | 2026-04-25 | Script + CI config | Prevent invalid `router.push(...)` merges. |
| P0-005 | Resolve `search.suggest` API parity gap | P0 | BE | Planned | 1d | 2026-04-25 | Backend decision | Implement endpoint or remove dead client method. |
| P1-001 | Replace placeholder logic in admin communities | P1 | FE | Planned | 1d | 2026-04-28 | Product expectation | `src/app/admin/communities.tsx`. |
| P1-002 | De-duplicate `/discover/trending` ownership | P1 | BE | Planned | 1d | 2026-04-28 | API refactor | Keep one canonical handler/service path. |
| P1-003 | Add integration tests: event creation -> discover visibility | P1 | QA/FE | Planned | 2d | 2026-04-30 | Test harness | Core regression prevention. |
| P1-004 | Add integration tests: checkout -> ticket issuance | P1 | QA/BE | Planned | 2d | 2026-05-01 | Test harness | Critical revenue path. |
| P1-005 | Add integration tests: scanner -> contact save | P1 | QA/FE | Planned | 1.5d | 2026-05-01 | Test harness | Real-world activation flow. |
| P1-006 | Add API contract tests (search/discover/admin/stripe) | P1 | QA/BE | Planned | 2d | 2026-05-02 | Contract list | Keep client/server parity. |
| P2-001 | Accessibility pass (Discover/Browse/Settings) | P2 | QA | Planned | 2d | 2026-05-05 | QA checklist | Keyboard + SR + contrast checks. |
| P2-002 | Performance baseline for list-heavy screens | P2 | FE/QA | Planned | 1.5d | 2026-05-06 | Perf script | FPS + memory snapshots web/native. |
| P2-003 | Add `docs/ROUTE_MAP.md` and `docs/API_MAP.md` | P2 | FE/BE | Planned | 1d | 2026-05-06 | Team review | Ownership + parity docs. |

## Weekly Plan (Rolling)

- [ ] Week 1: Close all P0 route/API parity items.
- [ ] Week 1: Finish P1-001 admin communities correctness.
- [ ] Week 2: Implement high-value integration tests (P1-003/4/5).
- [ ] Week 2: Add contract + route CI checks (P0-004, P1-006).
- [ ] Week 3: Accessibility + performance pass and documentation updates.

## Owner Legend

- `FE` = Frontend engineer
- `BE` = Backend engineer
- `QA` = QA engineer
- `DevEx` = CI/tooling owner

## Change Log

- 2026-04-23: Initial execution board created from current `TASKS.md` and repo scan.
- 2026-04-23: Added sprint-ready fields (owner placeholders, statuses, target dates) and marked immediate P0 items as in progress.
