# Nation Builders Program v2 — B2B Acquisition Engine & Staff Perk Flywheel

**Date**: 2026
**Status**: Design Phase
**Owners**: Product + Engineering + Growth

## 1. Vision & Business Goal

**Core Objective**:
Turn "Nation Builders" from a nice-to-have marketing story into a **high-volume B2B acquisition and retention engine** that:

- Brings **more businesses/venues** onto the platform (listings, events, CultureMarket, hostspace).
- Brings **large cohorts of engaged users** (their staff + their customers) into the app.
- Creates a clear, delightful path to **CulturePass+** conversion (the 50% staff discount is the hook).
- Builds long-term loyalty through **badges, recognition, and community**.

**Desired Flywheel**:
Business registers as Nation Builder Partner
→ Gets a unique staff promo code + co-branding
→ Staff redeem 50% off CulturePass+ + receive "Nation Builder" badge
→ Staff become power users (events, communities, tickets)
→ Business sees value (retention tool, foot traffic in quiet hours, brand love)
→ Business lists more, runs more events, promotes the app to customers
→ More CulturePass+ subscribers + platform revenue

## 2. Current State Problems (Audit Summary)

From code exploration:

- **NationBuildersProgram.tsx** — Purely informational. CTA loops to external marketing URL.
- **NationBuildersPromo** (on Discover) — Beautifully improved recently, but "Apply Now" still points to marketing URL. No real business action.
- **"Apply" intent** in copy says "List your venue for free" but no dedicated fast-track or special Nation Builder flow.
- **No product mechanism** exists for:
  - A business becoming a "Nation Builder Partner".
  - Generating business-scoped promo codes for staff.
  - Staff claiming the perk + receiving a visible badge.
- **Promo code system** (`admin/promo-codes`) supports `free_plus` type — this is reusable.
- **Host creation flow** is now unified under `/hostspace/create` (rich profiles use the full wizard; quick content uses the workspace launcher).
- **Badges** are mentioned in copy but have no real implementation yet for Nation Builders.
- **Admin surfaces** exist for host applications and promo codes — good foundation.

**Risk if unchanged**: The promo becomes noise. Businesses never feel the "partnership" benefit. Staff never get the actual 50% code easily.

## 3. Recommended Solution: "Nation Builder Partner" Program

### 3.1 Two Audiences, Two Entry Points

**A. For Staff / Essential Workers (Consumer side)**
- Discover the promo on Discover page or via word-of-mouth.
- "Learn More" → rich in-app experience.
- "Apply / Get My Discount" → Simple flow:
  1. Sign up / log in.
  2. Enter a code from their employer (or claim via approved business domain/email).
  3. Redeem 50% CulturePass+ (via existing `free_plus` promo logic).
  4. Automatically receive **Nation Builder badge** on profile + recognition.

**B. For Businesses / Venues (B2B Acquisition side) — Primary Focus**
- "Apply Now" from promo → **Fast-track into business/venue creation flow**.
- Special "Nation Builder Partner" path that:
  - Creates (or links) a verified `business` or `venue` Profile.
  - Marks the profile as a Nation Builder Partner (with approval or light self-serve + verification).
  - **Automatically generates** a branded promo code (e.g. `STAFF-CAFENAME-2026`) with generous `free_plus` terms (50% off for X months or recurring).
  - Gives the business owner tools to distribute the code to staff (dashboard share link, QR, email template).
  - Unlocks co-marketing benefits and a special "Nation Builder Partner" badge on their listing.

### 3.2 Better "Apply" Destination

**Recommended immediate + future path**:

Instead of sending everyone to the generic marketing page:

1. **Short term (Quick Win)**: "Apply Now" from the promo banner routes to:
   - `/hostspace/create?intent=nation-builder` (pre-selects business/venue types for the wizard).
   - Show a beautiful Nation Builder Partner onboarding screen first.

2. **Ideal long-term**:
   - Dedicated lightweight landing: `/nation-builders/apply` or integrated into hostspace/create with a prominent "Become a Nation Builder Partner" card.
   - After basic profile creation, auto-provision the staff discount code.
   - Nice success screen: "Your staff can now claim 50% off CulturePass+ using code `XXXX`"

This directly serves the goal: **more businesses onboarded faster**.

## 4. Key Product Features (MVP → Scale)

### MVP (Next 4-8 weeks)
- Enhanced NationBuildersProgram page with clear "For Businesses" and "For Staff" sections.
- "Apply as a Business" button that funnels into the existing host/business creation flow with Nation Builder context.
- Ability for approved businesses (or self-serve after listing) to generate a staff promo code from their dashboard.
- Staff redemption flow (enter code → get discounted CulturePass+).
- Basic "Nation Builder" badge on user profiles (visible when they have claimed the perk).
- Admin approval/oversight for Nation Builder Partners (extend existing host-applications or create lightweight version).
- Promo banner continues to be the main discovery surface (already improved with dismiss + gating).

### Phase 2
- Staff verification methods (email domain matching the business, manager approval link, simple claim code).
- Business dashboard section: "Your Nation Builder Staff Perk" with code management, usage stats, staff recognition.
- Co-branded benefits for the business (featured placement, "Nation Builder Partner" badge on their listing).
- Quarterly challenges / recognition for staff.

### Phase 3 (The Future)
- API/partner portal for large chains.
- White-label staff perks pages.
- Analytics for businesses on how their staff are engaging with culture.
- Tiered partnership levels (Silver/Gold/Platinum Nation Builder).

## 5. Technical Architecture Sketch

**New / Extended Concepts**:
- `NationBuilderPartner` (or flag on Profile: `isNationBuilderPartner: boolean`, with `approvedAt`, `partnerCodePrefix`).
- Enhanced PromoCode model to support `businessId` / `partnerId` scoping + staff-only redemption rules.
- User profile extension: `nationBuilderClaims: [{ businessId, claimedAt, badgeAwarded: true }]`.
- Badge system (general): `awardedBadges` array on user/profile with types including `nation-builder`.

**New or Enhanced Routes** (suggestions):
- `/nation-builders` or keep `/NationBuildersProgram` as the beautiful public-facing program page.
- `/nation-builders/apply` — Business partner application (lightweight entry point).
- Extend `/hostspace/create?category=business&intent=nation-builder`.
- Staff claim flow: `/nation-builders/claim` or handled inside membership upgrade with a special code entry.

**Admin**:
- Extend `/admin/host-applications` or new tab for Nation Builder Partners.
- Promo code generator scoped to partners.
- Ability to bulk-issue or manage staff codes.

**Data & Backend**:
- Leverage existing `free_plus` promo redemption logic in membership handler.
- Add business association to promo codes.
- Simple claim/award flow for badges (can start client-side + server verification later).

## 6. Immediate Next Steps (Execution Plan)

**Completed (as of this session):**
- "Apply Now" / "Join as Nation Builder" in `NationBuildersPromo` now routes to `/hostspace/create?intent=nation-builder`.
- `NationBuildersProgram.tsx` updated with dual CTAs:
  - Primary: "I'm a Business / Venue Owner — Become a Partner" → host application flow.
  - Secondary: Staff claim path.
- Copy throughout improved to set correct expectations for businesses vs staff.
- Full strategy document created (`NationBuildersProgram-Strategy-v2.md`).

1. **Next 1-2 weeks (High priority)**:
   - Enhance the host application / creation flow to detect `?intent=nation-builder` and show special Nation Builder Partner messaging + benefits.
   - Add basic support for marking a profile as a Nation Builder Partner and auto-generating a staff promo code (leverage existing `free_plus` promo system).

2. **Following 3-4 weeks**:
   - Staff claim/redeem flow for the generated codes.
   - Basic "Nation Builder" badge awarding on user profiles.
   - Business dashboard widget for managing/distributing the staff perk.

3. **Follow-up**:
   - Badge awarding on perk claim.
   - Basic business dashboard widget for managing the perk.
   - Admin tools for oversight.

4. **Measurement**:
   - Track: Business listings created via Nation Builder path.
   - Staff redemptions of NB codes.
   - Conversion rate from NB staff to paying CulturePass+ after the promo period.
   - Retention/engagement lift for NB staff vs control.

## 7. Open Questions for Discussion

- Should businesses self-serve the partner status (fast listing creation), or require light admin approval like host applications?
- How do we verify "real staff" of a partner business? (Domain email, unique claim code per employee, manager whitelist, etc.)
- Pricing of the staff discount — always 50% off for 12 months? Recurring annual? One-time?
- What concrete benefits do we promise businesses beyond "good PR" and staff retention? (Featured placement? Co-marketing? Analytics dashboard?)
- Do we want a public "Nation Builder Partners" directory page?

---

**This document is the living strategy.** We can now prioritize and execute features against it.

The goal is not just a nicer banner — it's a genuine growth channel that brings businesses and their people into the CulturePass ecosystem and converts them to the premium experience.

Ready to start building pieces of this? Let's pick the highest-leverage quick win first (the Apply flow + enhanced program page).