# CulturePass — Go-To-Market & Infrastructure Scaling Plan

> Date: March 2026 | Version: 1.0
> Audience: Founder, co-founders, investors, technical leads

---

## 1. What Is CulturePass?

CulturePass is a **B2B2C cultural lifestyle marketplace** for diaspora communities worldwide.

It solves a real gap: diaspora communities are vibrant and active, but their events, businesses, and gathering spaces are scattered across social media, WhatsApp groups, and niche websites. CulturePass unifies them in one beautifully designed, cross-platform experience.

**Three audiences, one platform:**

| Who | What They Get |
|-----|---------------|
| Community Members | Discover events, buy tickets, join communities, earn perks |
| Event Organisers & Artists | Publish events, sell tickets, reach a targeted cultural audience |
| Cultural Businesses & Venues | Directory listing, community reviews, foot traffic |

**Revenue streams:**
- CulturePass+ subscriptions ($9.99/month or $89.99/year AUD)
- Ticket booking fees (% per transaction via Stripe)
- Promoted event listings (organiser tier upgrades)
- Business directory premium listings

---

## 2. Current Status — What Is Built (March 2026)

### App Completion: 100% (launch-ready)

The core product is functionally complete across all three platforms (iOS, Android, Web).

#### What Is Done

| Feature | Status |
|---------|--------|
| Onboarding (login, signup, location, interests, communities) | Done |
| Discover tab — event rails, hero carousel, spotlight, indigenous section | Done |
| Events page — filter bar (category, date, price) | Done |
| Explore — 2-column category grid | Done |
| Event detail + ticket purchase (Stripe) | Done |
| Event creation wizard — 9 steps (basics, image, location, datetime, entry type, tickets, team, culture, review) | Done |
| Calendar — month grid, event dots, civic reminders | Done |
| Communities tab | Done |
| Perks + redemption | Done |
| Business / Venue / Organisation directory | Done |
| Profile + membership tiers (Free → VIP) | Done |
| QR ticket scanner | Done |
| Push notifications (FCM) | Done |
| Admin dashboard (users, audit logs, notifications) | Done |
| Organiser dashboard | Done |
| Web desktop layout — sidebar, responsive grid | Done |
| Firebase Auth (email + Google + Apple Sign-In) | Done |
| Stripe subscription checkout + webhook | Done |
| Council/LGA as location-proximity service | Done |
| Design token system — brand, component, gradient tokens | Done |
| Dark/light mode (dark default on native, light on web) | Done |
| Sentry error monitoring — wired in `_layout.tsx` + `lib/reporting.ts` | Done |
| GPS proximity events — `useNearbyEvents` + geoHash queries on backend | Done |
| TypeScript — zero errors | Done |
| ESLint — zero warnings | Done |
| Algolia full-text search | Post-launch (Month 1) |
| Firebase DataConnect / GraphQL | Exploratory |

#### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile + Web App | Expo 55 + React Native 0.83 + Expo Router 5 + Reanimated 4 |
| State Management | TanStack React Query + Context API |
| Backend API | Firebase Cloud Functions (Express, 150+ routes, 6500+ lines) |
| Database | Firestore (NoSQL) |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Payments | Stripe (subscriptions + one-off tickets) |
| Web Hosting | Firebase Hosting |
| Notifications | Firebase Cloud Messaging (FCM) |
| Analytics | PostHog + Firebase Analytics |
| Error Monitoring | Sentry |
| CI/CD | EAS Build (Expo) |

---

## 3. What Needs To Happen Before Public Launch

### Priority 1 — Must-Have Before Going Live

These are launch blockers. Nothing ships without these.

| Item | Owner | Effort |
|------|-------|--------|
| Set all EAS secrets (Firebase config, Stripe keys, Google Maps, Sentry DSN) | Founder / DevOps | 1 day |
| Create demo account for App Review (demo@culturepass.app) | Founder | 1 hour |
| Host Privacy Policy at `culturepass.app/privacy` | Founder | 1 day |
| Host Terms of Service at `culturepass.app/terms` | Founder | 1 day |
| Complete `npm run typecheck` — zero errors | Dev | 1–2 days |
| Complete `npm run lint` — zero errors | Dev | 1 day |
| Complete `npx expo export --platform web` — clean build | Dev | 1 day |
| Bump `app.json` version to 1.0.0 + iOS buildNumber + Android versionCode | Dev | 30 min |
| Configure Stripe production keys in Cloud Functions environment | Dev | 2 hours |
| Switch Stripe from test mode to live mode | Founder | 1 day |
| Configure Firebase production project (separate from dev) | Dev | 1 day |
| Fully configure Sentry DSN for error reporting | Dev | 2 hours |
| App Store Connect setup (name, screenshots, age rating, capabilities) | Founder | 1–2 days |
| Google Play Console setup (listing, data safety form, content rating) | Founder | 1–2 days |
| App screenshots at correct resolutions (iOS 1320×2868, Android 1080×2400) | Design/Founder | 1–2 days |
| TestFlight internal testing pass | QA/Founder | 2–3 days |
| Firebase production security rules audit | Dev | 1 day |

**Estimated time to App Store ready: 2–3 weeks with focused effort.**

### Priority 2 — Launch Quality (Week 1–4 Post-Launch)

| Item | Notes |
|------|-------|
| Geolocation geoHash queries | Users get nearby events by GPS, not just city |
| Algolia full-text search | Full-text across events, businesses, communities |
| Council LGA auto-select from GPS on onboarding | Friction-free first run |
| Playwright E2E smoke tests | Catch checkout + event creation regressions |
| Sentry performance traces | Monitor API latency, screen render times |
| CI pipeline (lint + typecheck + export on every PR) | Prevent regression at merge time |

### Priority 3 — Growth Features (Month 1–3 Post-Launch)

| Item | Notes |
|------|-------|
| Organiser analytics dashboard | Event attendance, revenue charts |
| In-app community messaging / direct chat | Drive retention |
| First Nations Spotlight editorial program | Curated cultural content |
| Multi-city event listings (NZ, UAE, UK, CA) | Market expansion |
| Affiliate/referral program | Growth loop for community leaders |
| Social sharing cards (Open Graph) | Viral event sharing |

---

## 4. Go-To-Market Strategy

The GTM follows a four-phase flywheel: build supply (organisers + events) before demand (users), launch publicly once content density is proven, activate revenue once engagement is established, then replicate the playbook in new markets.

---

### Phase 1 — Seed Communities (Months 1–2)
**Objective**: Build supply-side density before the public launch. No cold-start problem at go-live.

**Target**: 5–10 established diaspora community organisations in Sydney and Melbourne — South Asian, East African, Southeast Asian, Pacific Islander, Chinese Australian.

**Tactics**:
- Direct outreach to founder's personal network first, then warm intros to cultural association presidents
- White-glove onboarding: set up their community profile, publish their first 3 events, configure ticket tiers — founder does it with them
- Attend 2–3 cultural events as a participant, not a vendor — build trust before pitching
- WhatsApp seeding: reach out to group admins directly with a demo video, not a pitch deck
- Partner with multicultural councils (City of Sydney Multicultural team, City of Melbourne) for introductions to registered cultural organisations

**Success Metrics**:
- 10 active organiser accounts
- 50 published events
- 500 registered users (organic — no paid acquisition yet)
- NPS ≥ 40 from seed organisers (measure by direct conversation)
- At least 1 paid ticket transaction completed end-to-end in production

---

### Phase 2 — Public Launch (Month 3)
**Objective**: Create a coordinated awareness moment. iOS + Android + web live simultaneously.

**Tactics**:
- **App Store launch** — iOS App Store + Google Play on the same day; web already live at culturepass.app
- **PR push** — pitch to: SBS, NITV, Mosaik, Junkee, The Guardian Australia (multicultural beat), Indian Link, Greek Herald, and community-specific media in each diaspora
- **Influencer seeding** — identify 10–15 diaspora content creators (TikTok + Instagram, 5K–100K followers, culture/food/events niche); offer free CulturePass+ for 3 months in exchange for authentic coverage of events they'd attend anyway
- **Festival partnerships** — exclusive ticketing for 3–5 cultural festivals (target: Sydney Lunar Festival, Diwali events, Pacific Community events); position CulturePass as the official ticketing partner
- **Launch event** — cultural showcase in Sydney CBD; invite community leaders, media, and 50 seed users; record content for social
- **App Store Optimisation** — keywords: "cultural events Sydney", "diaspora events Australia", "multicultural events", "Indian events Melbourne"
- **Referral loop** — every ticket purchase generates a shareable event card; built-in social sharing on confirmation screen

**Success Metrics**:
- 5,000 registered users within 30 days of launch
- 10 active organiser accounts publishing events independently
- 200 published events
- 4.0+ App Store rating (≥ 50 reviews)
- Day-7 retention ≥ 25%

---

### Phase 3 — Monetisation (Month 4–6)
**Objective**: Convert engaged users into paying customers. Prove unit economics before expanding.

**Revenue stream activation sequence** (order matters — don't activate all at once):

1. **Ticket booking fee (Month 4)** — introduce 2.5% fee on all paid ticket transactions via Stripe. Lowest friction; users are already transacting. Organiser impact is minimal per ticket.
2. **CulturePass+ subscriptions (Month 4)** — email campaign to users who have attended ≥ 2 events. Offer 14-day free trial; no credit card required. Highlight: priority ticket access, exclusive perks, community digest.
3. **Organiser Pro tier (Month 5)** — tiered organiser plans:
   - Free: up to 3 events/month, basic analytics
   - Pro ($29/month): unlimited events, promoted listings, detailed analytics, custom event branding
   - Enterprise ($99/month): dedicated account manager, bulk ticket codes, white-label options
4. **Business directory premium listings (Month 6)** — onboard first 20 businesses at $49–$99/month. Target businesses already advertising in cultural media (Indian restaurants, migration agents, cultural clothing stores).

**Revenue Targets**:
- $5K–$10K MRR by end of Month 6
- 500–1,000 CulturePass+ subscribers
- 20 Pro or Enterprise organiser accounts
- 20 premium business directory listings
- Take rate on GMV: target 5–8% blended (booking fees + subscription revenue / total GMV)

---

### Phase 4 — Regional Expansion (Month 6–12)
**Objective**: Replicate the AU flywheel in 4 new markets. Each market gets a 6-week seed phase before public launch.

**Market sequence** (sequenced by diaspora density + founder network access):

| Market | Entry Month | Anchor Communities | Notes |
|--------|-------------|-------------------|-------|
| Auckland + Wellington, NZ | Month 7 | Māori, Pacific Islander, Indian | Closest cultural overlap to AU; same timezone |
| Dubai, UAE | Month 8 | South Asian (Indian, Sri Lankan, Pakistani), Arab | Largest South Asian hub globally; high disposable income; events-heavy culture |
| London, UK | Month 9 | Caribbean, South Asian, East African | Largest single English-speaking diaspora market; strong cultural event scene |
| Toronto, CA | Month 11 | South Asian, Chinese, Caribbean | Strong multicultural civic infrastructure; high app adoption |

**Entry playbook per market**:
1. Identify 3 anchor community organisations before soft launch (via LinkedIn outreach + diaspora media research)
2. Localise culture tags and event categories for the market (e.g., UAE: Arabic, South Asian, Filipino, Western expat)
3. Onboard 1 local community manager (contractor) — trusted community member, not a hired sales rep
4. Soft launch with seed organisers only; 4-week closed beta before public App Store listing in that region
5. PR in local diaspora media (e.g., Desi Blitz for UK, Salam Toronto for CA, Khaleej Times community section for UAE)

**Goal**: 50,000 registered users across all 5 markets by end of Year 1

---

## 5. Infrastructure — Current State and Scale Limits

### Firebase (Current)

Firebase works well for early-stage applications. The current architecture runs:
- **Firestore**: NoSQL document store for all app data
- **Cloud Functions**: Express API (all business logic)
- **Firebase Auth**: Identity management
- **Firebase Storage**: Media uploads
- **Firebase Hosting**: Web deployment

**Strengths of current Firebase setup:**
- Zero-ops — no servers to manage
- Real-time capabilities built in
- Fast development iteration
- Scales automatically to moderate traffic

**Limitations that will bite at scale (>50K users, >10K concurrent):**

| Issue | Impact |
|-------|--------|
| Firestore cold starts on Cloud Functions | 500ms–2s latency spikes under low traffic |
| Firestore query limitations (no full-text, no complex joins) | Forces workarounds; Algolia needed for search |
| Cloud Functions cost model | Gets expensive fast at high invocation volume |
| Firestore pricing at scale | Read/write costs compound with large datasets |
| Vendor lock-in | Firebase-specific APIs make migration harder over time |
| Limited analytics / BI capability | Hard to run business queries on Firestore data |
| No native job queue | Background jobs need third-party solutions |
| Single-region default | Latency for UAE/UK/CA users unless multi-region configured |

---

## 6. Infrastructure Migration Options

### Option A — Supabase (Recommended for Year 1–2)

**What it is**: Open-source Firebase alternative. PostgreSQL + Auth + Storage + Realtime + Edge Functions.

**Why consider it:**
- PostgreSQL — full relational queries, joins, full-text search (no Algolia needed for basic search)
- Supabase Auth is a drop-in for Firebase Auth patterns
- Row-level security (RLS) replaces Firestore rules — more powerful and portable
- Self-hostable — can move to your own infrastructure later
- Much lower cost at scale than Firebase for read-heavy workloads
- Built-in vector embeddings (pgvector) — future AI/recommendation features
- Dashboard with SQL editor — easy business intelligence queries

**Migration complexity**: Medium
- Firebase Auth → Supabase Auth (token strategy changes, user migration needed)
- Firestore → PostgreSQL (schema design work, data migration scripts)
- Cloud Functions → Supabase Edge Functions + Node.js API server
- Firebase Storage → Supabase Storage (S3-compatible)
- Firebase Hosting → Vercel or Supabase hosting

**Estimated migration timeline**: 8–12 weeks with 2 engineers

**Cost estimate (10K MAU)**:
- Firebase: ~$200–$500/month (Firestore reads + Functions + Storage)
- Supabase Pro: $25/month base + compute — 80%+ cheaper at same scale

---

### Option B — AWS (Recommended for Year 2–3, Enterprise Scale)

**What it is**: Full cloud infrastructure. Most enterprises run on AWS.

**Architecture for CulturePass on AWS:**

| Firebase Service | AWS Equivalent |
|-----------------|----------------|
| Firestore | Amazon DynamoDB (NoSQL) or Amazon RDS Aurora PostgreSQL |
| Cloud Functions | AWS Lambda + API Gateway or ECS Fargate (containerised) |
| Firebase Auth | Amazon Cognito |
| Firebase Storage | Amazon S3 + CloudFront CDN |
| Firebase Hosting | AWS Amplify Hosting or S3 + CloudFront |
| FCM (Push) | Amazon SNS + APNS/FCM bridge |
| Firestore Realtime | AWS AppSync (GraphQL subscriptions) or API Gateway WebSockets |

**Why AWS for scale:**
- Multi-region active-active (critical for AU + UAE + UK + CA markets)
- CloudFront CDN for image delivery (faster load times globally)
- Aurora Serverless v2 — scales from zero, pay per query
- SQS / SES / SNS — native job queues and notification infrastructure
- RDS PostgreSQL — full-text search, complex queries, joins
- AWS WAF + Shield — production-grade DDoS protection
- Enterprise compliance (SOC 2, ISO 27001, GDPR, Australian Privacy Act)

**Migration complexity**: High
- Complete re-architecture of auth, storage, and backend
- Requires DevOps expertise (IAM, VPC, security groups)
- Significant infrastructure-as-code work (Terraform / CDK)

**Estimated migration timeline**: 3–6 months with 3 engineers + DevOps

**Cost estimate (50K MAU, multi-region):**
- Firebase: $2,000–$8,000/month
- AWS: $800–$2,500/month (60–70% cheaper at scale with right architecture)

---

### Option C — Oracle Cloud Infrastructure (OCI)

**What it is**: Oracle's enterprise cloud. Strong on database performance and generous free tier.

**Why consider OCI:**
- Oracle Autonomous Database — self-tuning, self-patching, no DBA needed
- OCI Free Tier is the most generous in cloud (4 OCPUs ARM instances, 24GB RAM, 200GB storage — always free)
- Strong compliance posture for government/enterprise clients (if CulturePass targets councils)
- Object Storage (S3-compatible) + CDN included
- OCI Functions (serverless) compatible with existing Express patterns

**Why OCI is less ideal for CulturePass:**
- Smaller developer ecosystem than AWS/GCP
- Less tooling for mobile/app-specific services (no native FCM equivalent)
- Fewer community resources and integrations
- Not the default choice for startups

**Best use case for OCI:** If CulturePass wins government or large council contracts that require Oracle ecosystem compatibility.

---

### Option D — Hybrid Architecture (Best of All Worlds)

**Recommended for CulturePass Year 2:**

Keep Firebase for what it does well, migrate the rest:

| Layer | Platform | Why |
|-------|----------|-----|
| Auth | Firebase Auth | Keep — no migration needed, works across native |
| Push Notifications | Firebase FCM | Keep — best-in-class for mobile push |
| Primary Database | Supabase PostgreSQL | Full-text search, joins, BI queries |
| File Storage | AWS S3 + CloudFront | CDN delivery, cheaper at scale |
| API Server | AWS Lambda / ECS | Containerised, scales independently |
| Search | Algolia | Purpose-built for cultural marketplace faceted search |
| Web Hosting | Vercel | Better DX, edge CDN, zero-config Next.js if web is split |
| Background Jobs | AWS SQS + Lambda | Ticket emails, notification batch sends |
| Analytics | PostHog (self-hosted on AWS) | Full event tracking with no data residency concerns |

---

## 7. Recommended Migration Roadmap

### Year 1 (Launch → 10K users): Stay on Firebase, add Algolia

**Cost**: ~$300–$600/month all-in
**Action**: Don't migrate yet. Ship the product. Validate the market.

Improvements within Firebase that defer migration:
- Add Firestore composite indexes for `[city, date, status]` queries
- Implement geohash proximity queries
- Add Algolia for search (index events + businesses + communities)
- Enable Firebase multi-region for global data residency
- Set up CloudFront or Fastly in front of Firebase Storage for image CDN

### Year 1.5 (10K–50K users): Migrate to Supabase

**Cost**: ~$100–$400/month
**Migration**: Firestore → PostgreSQL, keep Firebase Auth + FCM

Key steps:
1. Design PostgreSQL schema from Firestore data model
2. Write migration scripts (Firestore export → PostgreSQL import)
3. Rewrite `functions/src/services/firestore.ts` → Supabase client
4. Swap API endpoints gradually (feature-flag rollout)
5. Keep Firebase Auth — Supabase supports JWTs from external auth providers
6. Run parallel writes (Firebase + Supabase) for 4-week validation period
7. Cut over — Firebase read deprecated, Supabase becomes primary

### Year 2+ (50K–500K users): AWS for scale

**Cost**: $1,500–$5,000/month
**Architecture**: Microservices on ECS Fargate, Aurora PostgreSQL, S3 + CloudFront, SQS

Key steps:
1. Containerise the Express API (`functions/src/app.ts` → Docker)
2. Stand up Aurora PostgreSQL Serverless v2 (migrate from Supabase)
3. Configure VPC, private subnets, NAT gateway
4. Set up CI/CD with GitHub Actions → AWS CodeDeploy
5. Multi-region: `ap-southeast-2` (AU/NZ), `me-south-1` (UAE), `eu-west-2` (UK), `ca-central-1` (CA)
6. CloudFront CDN for all media assets
7. AWS WAF for DDoS protection

---

## 8. Cost Comparison Summary

| Stage | Users | Firebase | Supabase | AWS |
|-------|-------|----------|----------|-----|
| Launch | 0–5K | $0–$50/mo | $25/mo | ~$200/mo |
| Early growth | 5K–20K | $150–$400/mo | $50–$150/mo | $300–$800/mo |
| Scale | 20K–100K | $600–$2,500/mo | $150–$600/mo | $600–$2,000/mo |
| Enterprise | 100K–500K | $2,500–$15K/mo | $500–$2K/mo | $1,500–$8K/mo |

**Bottom line**: Firebase is fine to launch. At 20K MAU it starts becoming expensive relative to alternatives. Supabase gives an 80% cost reduction with better SQL capabilities. AWS is the right call at 100K+ MAU when you need multi-region, compliance, and enterprise SLAs.

---

## 9. Legal & Compliance Checklist

Before going live in Australia, you need:

| Item | Status |
|------|--------|
| Privacy Policy (Australian Privacy Act 1988 compliant) | Needed |
| Terms of Service | Needed |
| Community Guidelines | Needed |
| Cookie / Tracking policy (for web) | Needed |
| Stripe merchant account (AU) — verified bank account | Needed |
| ACN or ABN registered for the business entity | Needed |
| Firebase / Google Data Processing Agreement signed | Check in Firebase Console |
| Data residency — Firestore region set to `australia-southeast1` | Check Firebase project |
| WCAG 2.1 AA accessibility audit | Recommended |
| Acknowledgement of Country on location screens | Done in app |

---

## 10. Launch Checklist (Summary)

### Week 1–2
- [ ] Set all EAS secrets
- [ ] Firebase production project configured
- [ ] Stripe live mode enabled
- [ ] Privacy Policy + ToS live on website
- [ ] `typecheck` + `lint` pass with zero errors
- [ ] App Store Connect account setup complete

### Week 3
- [ ] TestFlight internal build distributed
- [ ] Screenshot capture at correct resolutions
- [ ] Demo account created for App Review
- [ ] Android Play Console listing complete

### Week 4
- [ ] Production iOS build submitted for App Review
- [ ] Android build submitted
- [ ] Web deployed to Firebase Hosting (production URL)
- [ ] Monitoring alerts configured (Sentry + Firebase Crashlytics)

### Post-Launch (Month 1)
- [ ] Onboard 5–10 seed community organisers
- [ ] Geolocation geoHash proximity queries deployed
- [ ] Algolia search integration
- [ ] CI pipeline (lint + typecheck + export gates)
- [ ] Analytics dashboards live (PostHog + Firebase Analytics)

---

## 11. Investor-Ready Metrics to Track From Day 1

| Metric | Why It Matters |
|--------|---------------|
| DAU / MAU ratio | Measures habit formation — target >20% |
| Tickets purchased per MAU | Core transaction volume |
| Organiser-to-user ratio | Supply health of marketplace |
| CulturePass+ conversion rate | Subscription monetisation |
| D1 / D7 / D30 retention | Product-market fit signal |
| Gross Merchandise Value (GMV) | Total $ processed (tickets + subscriptions) |
| Take rate | % of GMV CulturePass earns |
| LTV / CAC ratio | Unit economics — target >3:1 |

---

## 12. Key Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Firebase cost spike at scale | Medium | Plan Supabase migration at 10K MAU |
| App Store rejection | Low | Follow all Apple guidelines; demo account ready |
| Low organiser supply at launch | High | White-glove onboard 10 organisers before launch |
| Community backlash on First Nations content | Low | Consult with Indigenous Advisory before editorial program |
| Stripe chargeback fraud on ticket sales | Medium | Enable Stripe Radar, require user identity verification |
| Data breach / privacy incident | Low | Firestore rules audit, HTTPS only, token-based auth |
| Competitor reaction (Eventbrite, Humanitix) | Medium | CulturePass is niche (diaspora-specific) — not a direct competitor to horizontal ticketing platforms |

---

*Last updated: May 2026*
*Prepared by: CulturePass Engineering & Product*
