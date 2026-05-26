# CulturePass.App

> **Connecting cultures, building belonging.**

CulturePass is the leading lifestyle platform for cultural diaspora communities. It connects people to events, creators, venues, businesses, and communities — with world-class tools for hosts to publish, monetize, and grow.

**Live on iOS, Android, and Web since April 2026.**

---

## Mission

To give cultural creators, venues, and communities the best possible tools to reach their audiences and build sustainable cultural businesses — with the reliability, craft, and operational excellence of the world's best platforms.

We are building this with the same standards of engineering discipline, user trust, and long-term thinking as the teams at Apple, Google, Amazon, x.com, and SpaceX.

---

## Current Status (2026)

| Area                    | Status                          | Notes |
|-------------------------|----------------------------------|-------|
| **Consumer App**        | Production                      | Full discovery, ticketing, communities, perks |
| **HostSpace**           | Production (strong foundation)  | Most sophisticated subsystem; unification in progress (see ADR-001) |
| **Admin & Operations**  | Production (good for small team)| Major operational hardening in Phase 2 |
| **Two-Layer Approvals** | Production                      | Host Applications + Verification Tasks with audit |
| **Architecture**        | Documented                      | See `docs/ARCHITECTURE.md` + ADRs |

---

## Getting Started (Primary Path)

We are investing heavily in making the developer experience reliable and fast (Phase 0 of our transformation plan).

### Prerequisites
- Node.js 22.14+
- Firebase CLI
- (For native) Xcode + Android Studio

### Recommended Local Development

```bash
# One command goal (work in progress — see Phase 0)
npm run dev
```

**Current reliable path** (until `npm run dev` is fully hardened):

1. Follow the steps in `REBUILD.md` for a clean environment (nuclear cleanup if needed).
2. `npm install --legacy-peer-deps`
3. Start emulators: `firebase emulators:start --only functions,firestore,auth`
4. Start the app: `npx expo start --web --clear` (or `--ios` / `--android`)

**Doctor Script** (coming in Phase 0):
We are building `npm run doctor` / `scripts/doctor.sh` to validate your environment and catch the most common issues automatically.

See `docs/ARCHITECTURE.md` for the high-level system view.

---

## Key Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** — Current state, data flows, principles, and boundaries.
- **Architecture Decision Records (ADRs)** — `docs/ADRs/`
  - [ADR-001: Host Creation Unification](docs/ADRs/001-host-creation-unification.md)
  - [ADR-002: Developer Experience & Environment Strategy](docs/ADRs/002-developer-experience-and-environment-strategy.md)
- **HostSpace Internal Docs** — Excellent living documentation inside `src/modules/host/` (IMPLEMENTATION_*.md, TASK_*.md, etc.).
- **Rebuild Guide** — `REBUILD.md` (emergency recovery procedures — we are actively reducing the need for this).

---

## Project Structure (High Level)

```
src/
├── app/                  # expo-router file-based routing
├── modules/              # Feature modules (host/ is the largest and most mature)
├── platform/api/         # Typed API client
├── design-system/        # Tokens + M3 + cultural components
├── lib/                  # Core (api, query-client, auth, config)
└── hooks/                # Data + domain hooks

functions/src/
├── handlers/             # Express routers
├── services/             # Business logic
├── middleware/           # Auth, validation, rate limiting
└── triggers/             # Firestore event-driven side effects

shared/
└── schema/               # Single source of truth for domain models (used by client + server)
```

See `docs/ARCHITECTURE.md` for the full picture.

---

## World-Class Transformation Plan

We are executing a deliberate, phased plan to raise CulturePass to the highest standards of engineering and product quality:

1. **Phase 0: Foundations** — DX, documentation, governance (current focus)
2. **Phase 1: HostSpace Excellence** — Unify the creation experience (see ADR-001)
3. **Phase 2: Operational Maturity** — Make admin tooling best-in-class
4. **Phase 3+: Platform & Delight** — Extract primitives, performance budgets, internationalization, signature experiences

The full plan is available in the planning artifacts from the current engineering review.

---

## Contributing

- Major architectural changes require an ADR.
- We are moving toward strict code ownership for high-risk areas (see future `CODEOWNERS`).
- Documentation updates are first-class contributions.

---

## Technology

- **Frontend**: Expo 56 + React Native + react-native-web + expo-router + TanStack Query v5
- **Backend**: Firebase Functions (Express) + Firestore + Auth + Storage
- **Design**: Custom M3 + expressive cultural design system
- **Payments**: Stripe (including Connect)
- **Analytics**: PostHog

---

## Contact & Ownership

This is an ambitious project with high standards. Questions about architecture or major changes should reference the relevant ADR or `docs/ARCHITECTURE.md`.

We build like the best teams in the world — with clarity, discipline, and a relentless focus on making the experience delightful and reliable for cultural creators and communities.

---

**"Connecting cultures, building belonging."**