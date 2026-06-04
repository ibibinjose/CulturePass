# ADR-003: Public Profile Security, Digital ID, and Wallet Refactor

**Status**: Accepted  
**Date**: 2026-06  
**Authors**: Engineering  
**Affects**: `src/app/cpu/`, `src/app/user/[id].tsx`, `src/app/profile/qr.tsx`, `src/modules/payment/screens/wallet.tsx`, `src/app/+html.tsx`, `firebase.json`

---

## Context

Several interconnected issues were identified post-launch:

1. `/cpu/CP-U590D86` routes showed "This screen doesn't exist" while `/cpu/ibibinjose` worked — a route case-sensitivity bug.
2. Public profiles exposed email and phone directly in the DOM, enabling bot scraping.
3. The `/payment/wallet` screen mixed financial data, the Digital ID card, and ticket management into one 1,487-line component.
4. The `/profile/qr` print function called `window.print()` on the whole app page instead of just the card.
5. Web security headers (CSP) were missing from Firebase Hosting.
6. SEO/metadata was basic — missing structured data, image dimensions, Twitter creator tag.

---

## Decisions

### 1. Route Case Normalization

**Problem**: Expo Router's file-based routing is case-sensitive on Linux/Firebase Hosting. The route folder was `src/app/CPU/[id].tsx` (uppercase) but `canonicalUserPath()` generates `/cpu/...` (lowercase). macOS silently masked this because HFS+ is case-insensitive.

**Decision**: Rename `CPU/` → `cpu/` and `(shortlinks)/CPU/` → `(shortlinks)/cpu/` using a two-step temp rename on macOS.

**Rule**: All Expo Router route folders must be lowercase. Never rename `FOO` → `foo` directly on macOS — go through `_foo_tmp` first.

---

### 2. Swipe-to-Reveal for Contact Info

**Problem**: Email and phone were rendered in plain text, visible to any bot that crawled the page.

**Decision**: Implement `SwipeToReveal` component in `src/app/user/[id].tsx` that:
- Shows masked values (`j***@***.com`, `+61 *** ***`) by default
- Only renders real values when `currentUserId` is truthy (Firebase auth required)
- Authenticated users swipe right (60px threshold) or tap the lock to reveal
- Uses `PanResponder` + `Animated` — no new dependencies

**Masking helpers**: `maskEmail()` and `maskPhone()` in `user/[id].tsx`.

---

### 3. Digital Business Pass on Public Profile

**Decision**: Add a `bizPassCard` preview at the bottom of every `/cpu/[id]` profile page showing:
- Avatar, name, handle, CPID, tier label, mini QR code
- Tapping navigates to `/profile/qr` for the full Digital ID experience
- White card design (always — regardless of theme) matching the real card appearance
- Share text updated to include `🪪 Digital Business Pass` and the CPU URL

---

### 4. Isolated Print Window for Digital ID

**Problem**: Calling `window.print()` from the React Native Web app printed the entire page shell — nav bars, background, everything.

**Decision**: The `openPrintWindow()` function in `src/app/profile/qr.tsx`:
- Opens a dedicated popup window containing **only** the card HTML/CSS
- Sets `document.title` to the suggested filename (`culturepass-@username-business-pass`)
- Uses `@page { size: 330px 210px; margin: 0 }` for exact card dimensions
- Auto-triggers `window.print()` after 600ms (images load time)
- QR code rendered via `api.qrserver.com` URL (no canvas dependency)
- Falls back to app `window.print()` only if popup is blocked

**Each card has its own Download button** (`'business'` | `'lanyard'`) that targets the specific card type.

**Rule**: Never call `window.print()` directly from the main app page.

---

### 5. Wallet Screen Refactor

**Problem**: `/payment/wallet` contained:
- A 3D flippable membership ID card (also in `/profile/qr`)
- Upcoming/past ticket tabs (also in `/tickets`)
- Per-ticket Apple/Google Wallet buttons (also in `/tickets/[id]`)
- Apple/Google Wallet "Add business card" buttons (also in `/profile/qr`)

This caused confusion about where features lived and inflated the file to 1,487 lines.

**Decision**: Refactor to a pure financial dashboard:

| Kept | Removed (moved to correct surface) |
|---|---|
| Wallet balance card | 3D flippable card |
| Rewards strip (points, tier) | Ticket upcoming/past tabs |
| Membership progress bar | Per-ticket wallet add buttons |
| Upgrade prompt | Apple/Google business card buttons |
| Quick stats (balance, cashback, events) | All Reanimated animations |
| Quick nav 2×2 grid | EMVChip component |
| Recent transactions (last 3) | QR code |

Result: ~445 lines of logic, no animation library usage, clear single responsibility.

**Surface map** (canonical):

| Route | Owns |
|---|---|
| `/payment/wallet` | Balance, cashback, rewards, loyalty progress |
| `/payment/transactions` | Full transaction history |
| `/tickets` / `/tickets/[id]` | Ticket list + per-ticket wallet |
| `/profile/qr` | Digital ID cards + business card wallet |

---

### 6. Web Security Headers

**Problem**: Firebase Hosting had only `X-Content-Type-Options` and `Referrer-Policy`. No CSP, no HSTS, no `X-Frame-Options`.

**Decision**: Add to `firebase.json` (both sites):
- `Content-Security-Policy` — with `'unsafe-inline'` and `'unsafe-eval'` (required for RN Web + Reanimated)
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Updated `Permissions-Policy` to block `interest-cohort=()`

**Critical rule**: CSP must never be set via `<meta http-equiv="Content-Security-Policy">` in `+html.tsx`. React Native Web's Metro bundler and Reanimated both require `eval()` — a CSP meta tag breaks them immediately. HTTP headers via Firebase Hosting do not affect the Metro dev server.

---

### 7. SEO and Structured Data

**`src/app/+html.tsx` improvements**:
- Added `og:image:width/height`, `og:locale`, `og:locale:alternate`
- Twitter/X `twitter:site` + `twitter:creator` tags
- Schema.org `MobileApplication` JSON-LD (alongside existing `Organization` + `WebSite`)
- Apple Smart App Banner (`apple-itunes-app`)
- PWA meta tags
- `hreflang` for `en-AU`, `en`, `x-default`
- Print CSS to hide nav chrome

**`src/app/user/[id].tsx` Head improvements**:
- `og:profile:username` property
- `og:image:width/height: 1200x630`
- `og:image:alt` = `"{name} — Digital Business Pass on CulturePass"`
- Schema.org `Person` JSON-LD with CPID as identifier, location, sameAs
- `robots: index,follow,max-image-preview:large`

---

## Consequences

**Positive**:
- `/cpu/CP-XXXXXX` now works correctly on all case-sensitive filesystems
- Bot scraping of email/phone from public profiles is mitigated
- Wallet page has a clear single responsibility
- Printing produces a correctly-sized, filename-suggested PDF
- Web security posture improved (HSTS, CSP, X-Frame-Options)
- Public profile pages have better Google/social metadata

**Negative / Watch**:
- `api.qrserver.com` is an external service for print QR — if it goes down, the print QR won't show. Consider a self-hosted fallback or a local QR SVG generator library.
- The `SwipeToReveal` gesture uses `PanResponder` which is less smooth than Reanimated on native. Acceptable for now.
- The `openPrintWindow` popup can be blocked by browsers. The fallback (`window.print()` on the app) is still bad UX — a future improvement would use `html2canvas` or a server-side PDF endpoint.
