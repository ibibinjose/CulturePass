# ADR 0001: `src/modules` is canonical, routes are thin

- Status: Accepted
- Date: 2026-04-30
- Last reviewed: 2026-05-08
- Decision owners: Platform Architecture

## Context

The codebase has overlapping UI and domain logic across route files, legacy `components/*`, and `src/modules/*`.
This creates unclear ownership, duplication, and difficult migration sequencing.

We need a stable architecture boundary that supports incremental migration without blocking delivery.

## Decision

1. `src/modules/*` is the canonical home for domain logic and domain UI.
2. Route files in `src/app/*` are thin composition shells:
   - parse params
   - wire providers/layout
   - render module entry points
   - avoid domain/business logic
3. Dependency direction is enforced as:
   - `src/app` -> `src/modules` -> platform/shared
   - `src/modules` must not import from `src/app`
4. Legacy `components/*` is frozen for net-new feature work.
   - Allowed only for emergency patches
   - New work must land in `src/modules/*`

## Platform/Shared definition

For dependency direction, platform/shared includes:

- `src/lib/*`
- `src/hooks/*`
- `src/contexts/*`
- `src/constants/*`
- `shared/*` (repo root)
- `src/design-system/*`

## Consequences

- Clear ownership by domain folder under `src/modules/*`
- Safer refactors with explicit import boundaries
- Route files become easier to test and reason about
- Migration can proceed feature-by-feature without re-opening legacy architecture

## Rollout

1. Add lint rules for import direction and route thinness boundaries.
2. Publish per-domain ownership map.
3. Add legacy freeze guard with emergency override (`LEGACY_COMPONENTS_EMERGENCY=1`).
4. Move existing legacy usages into module entry points over time.
5. Verify with `npm run guard:legacy-components` in CI.
