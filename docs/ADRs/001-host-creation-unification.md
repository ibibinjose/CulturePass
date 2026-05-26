# ADR-001: Unify Host Profile Creation Around the FormWizard Engine

**Status**: Accepted (Phase 0 Foundations)  
**Date**: Current session  
**Deciders**: Engineering + Product  
**Related**: World-Class Transformation Plan (Phase 1), HostSpace Architecture

---

## Context

CulturePass has two parallel paths for hosts to create rich entity profiles (artist, business, venue, community, organizer, professional):

1. **The Full FormWizard** (`src/modules/host/components/FormWizard/`, 6 steps, entity-specific fields, drafts, versioning, legal gates, accessibility utilities, AI assist, verification-aware checklist, rich internal documentation).
2. **The Creation Lab Workspace** (`HostspaceCreateWorkspace.tsx` + dedicated lighter forms: `HostspaceEventCreateForm`, `HostspaceCommunityCreateForm`, `HostspaceOfferCreateForm`, `CultureMarketListingWizard`, etc.) + `EntityTypeSelector`.

The sophisticated FormWizard was built with clear "enterprise-grade" intent (see the many `IMPLEMENTATION_SUMMARY.md`, `TASK_*.md`, and `README.md` files inside `src/modules/host/`). However, in the current runtime flow (`/hostspace/create`), the lighter workspace + dedicated forms are the dominant/primary path for most creation actions. Profiles are often treated as prerequisites rather than first-class outputs of the wizard.

This creates:
- Duplication of form logic and validation.
- Inconsistent user mental models ("Why is creating a venue different from creating an organizer profile?").
- Risk that the best-engineered part of the product (the wizard) is under-utilized.
- Harder maintenance and slower iteration on the most complex, high-stakes user flow (legal, verification, media, location).

---

## Decision

**We will make the full FormWizard (or a unified evolution of it) the single canonical engine for all rich host profile creation and editing.**

- `EntityTypeSelector` + `HostspaceCreateWorkspace` will route rich entity profile creation/editing through the FormWizard.
- Lighter dedicated forms for events, offers, communities, and marketplace listings will remain (or be evolved) as they serve different purposes (content under a parent profile vs. the profile itself).
- The wizard will become the "profile platform" primitive.

---

## Consequences

### Positive
- Single source of truth for drafts, auto-save, versioning, validation, entity polymorphism, accessibility, and verification gates.
- Much higher leverage from the existing high-quality work in the `host/` module.
- Consistent, guided experience for the hardest part of becoming a host (especially legal/verification steps).
- Easier to add future capabilities (multi-language profiles, collaboration, advanced analytics) in one place.
- Better alignment with the "world-class HostSpace" vision in the transformation plan.

### Negative / Trade-offs
- Short-term integration cost (mapping all entry points, migrating state, updating tests and docs).
- Risk of temporarily regressing the "quick create" feel for simpler entities (mitigated by keeping lighter paths for non-profile content and adding "quick profile" starters/templates).
- Need to ensure the wizard remains performant and delightful on mobile (already partially addressed with lazy steps and gestures).

### Neutral
- The existing `HostspaceCreateWorkspace` UI (category grid, parent profile selector, verify card) will evolve into a launcher/orchestrator rather than containing the form logic itself.

---

## Alternatives Considered

1. **Continue with two systems** ("quick" vs "full wizard"): Rejected. Increases maintenance burden and user confusion. Violates the principle of platform thinking.
2. **Evolve the lighter forms to match wizard fidelity**: Rejected. Duplicates the excellent work already done in the FormWizard.
3. **Deprecate the wizard**: Rejected. It is the highest-quality subsystem in the app and the clearest expression of the team's ambition.

---

## Implementation Notes (High Level)

- Phase 1 of the World-Class Plan owns this.
- Start with a mapping spike of every creation entry point.
- Introduce feature flag or gradual rollout for the unified path.
- Add "Start from template" or "Quick profile" affordances inside the wizard for simpler entities.
- Ensure draft recovery and parent-profile selection work seamlessly when entering the wizard from the workspace.

---

## Status Tracking

- [ ] Mapping spike complete
- [ ] ADR reviewed and accepted
- [ ] Unification spike (prototype routing one entity type through wizard)
- [ ] Full rollout with measurement

**References**:
- `src/modules/host/components/FormWizard/`
- `src/modules/host/components/HostspaceCreateWorkspace.tsx`
- `src/app/hostspace/create/index.tsx`
- `src/modules/host/` internal IMPLEMENTATION_*.md files (goldmine)