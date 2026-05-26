# Creator Trust Playbook: Host Profile Creation

**Status**: Living Document  
**Owner**: Product + Engineering (Principal Level)  
**Applies To**: All rich persistent entity profile creation flows (Community, Organiser, Venue, Business, Artist, Professional)  
**North Star**: Every creator must feel that CulturePass respects their time, reputation, legal exposure, and livelihood.

---

## 1. Immutable Trust Principles

1. **Never lose their work** — Drafts, auto-save (every 8s), recovery, and versioning are non-negotiable.
2. **Legal & compliance is a partnership**, not a trap or surprise.
3. **Verification status must be transparent, timely, and actionable** at every relevant moment.
4. **Respect the creator’s time and emotional labor** above vanity metrics.
5. **Forgiveness > perfection** — every friction point must offer a clear, low-effort recovery path.
6. **Tone**: Calm competence + cultural warmth. Never corporate legalese or condescending.

---

## 2. Microcopy Standards

### Global Rules
- Lead with benefit/outcome before requirement.
- Use "you" and active voice.
- Quantify where possible ("usually completes in 1–3 days").
- Offer the "why it matters for your work" in one sentence.

### Specific Templates

**Legal / Compliance (Step 3)**
- Good: "This information protects you legally and unlocks paid ticketing and CultureMarket sales faster."
- Good (ABN success): "ABN verified. This lets you accept payments without delays."
- Bad: "Enter your ABN (required)"

**Draft Recovery**
- Header: "Continue your work?"
- Body: "We saved your progress on this {entity}. Pick up exactly where you left off."
- Primary: "Continue editing"
- Secondary: "Start fresh (your current work stays saved)"

**Verification Status**
- "Live now for: Directory listing + free events."
- "To unlock: Paid ticketing, CultureMarket sales, and featured placement."
- Action: "Complete verification" or "Add documents to speed up review"

**Error / Friction States**
- ABN lookup slow/fail: "Government lookup is taking longer than usual. You can continue and we’ll verify in the background, or try again in a moment."
- Upload failure: "Upload didn’t complete. Your other progress is safe. Retry or continue without this file for now."

---

## 3. Trust-Relevant State Machine

See Mermaid diagram in the companion Journey Maps document.

Key states that must surface trust signals:
- `draft_available`
- `step_3_legal` (highest friction + highest trust repair opportunity)
- `verification_pending`
- `published_live_with_limitations`
- `post_publish_activation`

---

## 4. Required Trust-Building Mechanisms (Per Flow)

### Draft Recovery (Mandatory)
- Always offered automatically on return if drafts exist for that entity type.
- Shows: entity icon + label, name (if present), % complete, current step label, relative age.
- Progress ring or bar (color per entity type).
- "Continue" is the dominant, high-contrast action.

### Step 3 — Legal & Compliance (Highest Stakes)
- Real-time ABN validation with clear success/failure states.
- Conditional fields explained with livelihood impact.
- Licences: expiry dates + "This helps venues and councils trust your listing."
- Prominent but calm verification context banner.

### Verification Status Banner (Reusable)
Must appear in:
- Wizard Step 3 and Step 6
- Post-publish success screen
- HostSpace profile list / dashboard cards

Variants: Full, Compact (for steps), Card (for lists).

### Post-Publish Activation (The Trust Confirmation Moment)
Within 30 seconds of publish success, surface 2–3 high-value, one-tap actions:
1. Create first event / offer under this profile
2. Improve profile (photos, description, handle)
3. Share or invite core members

---

## 5. Forgiveness Patterns (Implementation Checklist)

- Every validation error: message + "Why this matters" + primary fix action.
- Network/API failure: "Your work is saved. Retry" + "Continue offline".
- User abandons mid-flow: Draft is guaranteed. Recovery is prominent on next entry.
- Handle conflict or slug issues: Clear explanation + suggested alternatives + "We can reserve this for 48 hours".

---

## 6. Measurement (Trust Health)

See companion Instrumentation Plan. Core signals:
- Draft recovery usage rate (target: >35% of sessions with drafts)
- Step 3 completion rate with ABN success
- Post-publish activation click rate within 5 min (target: >55%)
- Qualitative: "I felt confident my work was safe" (pulse survey or support ticket themes)

---

## 7. Anti-Patterns (Never Ship)

- Silent requirement that later blocks monetization.
- Losing draft progress (even on auth edge cases).
- Opaque "Pending" without "what this means for you today".
- Treating legal fields as pure data collection instead of livelihood enablement.

---

## 8. References & Ownership

- Primary implementation: `src/modules/host/components/FormWizard/` + steps + `DraftRecoveryModal.tsx`
- Analytics: `src/modules/host/services/formAnalyticsService.ts` + `@/lib/analytics`
- Design tokens: `@/design-system/tokens/theme`
- Related ADRs: ADR-001 (Host Creation Unification)

**Update cadence**: Any change to wizard steps, recovery, or verification flows must update this playbook.

---

*This document is the constitutional reference for all Host profile creation work. When in doubt, default to protecting creator livelihood trust.*
