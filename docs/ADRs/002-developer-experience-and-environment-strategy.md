# ADR-002: Developer Experience & Local Environment Strategy

**Status**: Accepted (Phase 0 Foundations)  
**Date**: Current session  
**Deciders**: Engineering  
**Related**: World-Class Transformation Plan (Phase 0), REBUILD.md, ADR-001

---

## Context

The current local development experience for CulturePass is fragile and high-friction:

- Complex API URL resolution logic (`src/lib/query-client.ts`) with many conditional paths (explicit env, same-origin, Functions emulator at 5001, legacy dev server, hosted Cloud Functions, Android emulator host mapping, etc.).
- Emulator token matching requirements (Firebase Auth emulator vs production tokens).
- Frequent "nuclear cleanup" procedures documented in `REBUILD.md` (rm -rf node_modules, .expo, ios, android, dist, watchman, Metro caches, pod install, etc.).
- Conditional prebuild behavior for Apple targets (`@bacons/apple-targets`).
- Multiple entry points and scripts with subtle differences between web, native, and backend.
- New engineers or people returning after time away often lose significant time to environment issues.

This directly contradicts the principle that **"the environment should be a source of joy and velocity, not a tax."** Elite teams (Google, Apple, Amazon, SpaceX, xAI) treat developer experience as a first-class product with extremely high reliability and low time-to-productivity.

The current state creates real risk of configuration drift between local, preview, and production, plus slow onboarding.

---

## Decision

We will treat **Developer Experience as a first-class internal product** with the following commitments:

1. **One primary happy path**: `npm run dev` (or `make dev`) should start a productive full-stack environment (Expo web + emulators + seed data) with minimal manual steps.
2. **Fast feedback & validation**: A `scripts/doctor.sh` (or `npm run doctor`) command that validates the environment, detects common misconfigurations, and gives clear remediation steps.
3. **Simplified configuration story**: Reduce the number of ways the API base URL and emulator connections can be resolved. Prefer explicit, auditable configuration over clever auto-detection where possible.
4. **Documentation & repeatability**: `REBUILD.md` becomes shorter over time. The primary path is documented in the root `README.md`.
5. **Gradual migration**: We will not break existing workflows immediately, but new work and onboarding will use the improved path.

---

## Consequences

### Positive
- Dramatically faster onboarding and context switching.
- Reduced risk of "works on my machine" / production configuration drift.
- Higher team velocity and morale.
- Easier to add automated checks (CI can run the doctor script).
- Aligns with the "build like the best teams" mandate in the transformation plan.

### Negative / Costs
- Upfront investment (2–4 weeks of focused DX work in Phase 0).
- Need to maintain backward compatibility during transition.
- Some clever auto-detection logic may be simplified or removed (acceptable trade-off for clarity).

### Risks
- Over-engineering the DX layer (solution should be simple and maintainable).
- Resistance from people who have learned the current painful path (mitigate with clear communication and celebration of wins).

---

## Alternatives Considered

1. **Status Quo + Better Docs**: Rejected. Documentation alone does not fix fragile, high-friction systems. The pain is real (evidenced by REBUILD.md).
2. **Full containerized dev environment (Docker / Dev Containers)**: Considered. Attractive for perfect hermeticity, but adds complexity for native iOS/Android development and Apple targets. We will evaluate it as a follow-on improvement after the primary path is solid, not as the first step.
3. **"Just use the cloud dev environment"**: Rejected for now (latency, cost, native development friction).

---

## Phased Implementation Outline

**Phase 0 (Foundations)**:
- Prototype `npm run dev` / `make dev` that launches Expo + emulators + helpful seed.
- Implement `scripts/doctor.sh` covering Node version, key ports, Firebase project, API URL resolution, emulator status, and common token issues.
- Simplify the most confusing parts of API URL resolution (clear precedence + validation).
- Update `README.md` with the new primary path.
- Shorten `REBUILD.md` or mark large sections as "emergency recovery only."

**Phase 1+**:
- Add the doctor script to CI.
- Evaluate Dev Containers for even stronger guarantees.
- Add performance/lint gates that run in the "dev" environment.
- Measure "time to first productive change" for new engineers as a metric.

---

## Success Metrics

- New or returning engineer reaches a working dev server + can make a visible UI or API change in < 30 minutes on a fresh machine.
- `REBUILD.md` is dramatically shorter and less frequently referenced.
- Doctor script catches the top 5 environment issues that previously required nuclear cleanups.
- Positive qualitative feedback in team retros ("dev environment feels reliable now").

---

**References**:
- `REBUILD.md` (current pain signal)
- `src/lib/query-client.ts` (API URL resolution logic)
- `app.config.js` (plugins and prebuild behavior)
- `firebase.json` (emulator ports)
- Future: `scripts/doctor.sh` and root `package.json` scripts

This ADR will be updated as the DX improvements are implemented.