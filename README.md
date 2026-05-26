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
| **UI/UX Enhancements**  | Production                      | Responsive design, improved accessibility, consistent footers |
| **Design System**       | Production                      | Comprehensive spacing tokens, responsive utilities |

---

## Features

### Core Features
- **Event Discovery**: Find cultural events tailored to your community interests
- **Venue Connections**: Discover and connect with cultural venues worldwide
- **Community Building**: Join and participate in cultural communities
- **Personalized Recommendations**: Curated content based on your cultural interests
- **Multi-platform Support**: Seamless experience across iOS, Android, and Web

### Recent Improvements
- **Enhanced UI/UX**: Improved spacing and responsive design for desktop and mobile
- **Consistent Footer**: Unified footer component across all pages with navigation, legal, and social links
- **Accessibility**: Enhanced accessibility features and improved user experience
- **Performance**: Optimized loading times and smoother navigation
- **Cultural Sensitivity**: Respectful representation of diverse cultural communities

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

### Design System Components
- **[Footer](src/components/Footer.tsx)** - Consistent footer across all pages with navigation, legal, and social sections
- **[Spacing Tokens](src/design-system/tokens/spacing.ts)** - Responsive spacing system for consistent layouts
- **[Responsive Utilities](src/lib/responsive.ts)** - Utilities for managing responsive design patterns
- **[Site Footer Links](src/lib/site-footer-links.ts)** - Centralized footer navigation management

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
- UI/UX improvements should maintain consistency with the design system and cultural sensitivity guidelines.

---

## Technology

- **Frontend**: Expo 56 + React Native + react-native-web + expo-router + TanStack Query v5
- **Backend**: Firebase Functions (Express) + Firestore + Auth + Storage
- **Design**: Custom M3 + expressive cultural design system
- **Payments**: Stripe (including Connect)
- **Analytics**: PostHog
- **State Management**: Zustand + React Hook Form
- **Validation**: Zod + Custom Error Handling
- **Maps**: React Native Maps
- **QR Codes**: React Native QR Code SVG

---

## Quality Assurance

- **Testing**: Jest for unit tests, integration, and end-to-end tests (205+ test cases)
- **Code Quality**: ESLint + TypeScript strict mode + Prettier
- **Security**: Firebase security rules, input validation, secure authentication
- **Performance**: Bundle size monitoring, lazy loading, caching strategies
- **Accessibility**: WCAG 2.1 AA compliance, screen reader support

---

## Cultural Sensitivity & Inclusivity

CulturePass is committed to respectfully representing diverse cultural communities:
- Inclusive design practices that honor various cultural aesthetics
- Respectful content moderation and community guidelines
- Multi-language support capabilities
- Culturally-aware recommendation algorithms
- Accessibility features for diverse user needs

---

## Contact & Ownership

This is an ambitious project with high standards. Questions about architecture or major changes should reference the relevant ADR or `docs/ARCHITECTURE.md`.

We build like the best teams in the world — with clarity, discipline, and a relentless focus on making the experience delightful and reliable for cultural creators and communities.

---

**"Connecting cultures, building belonging."**