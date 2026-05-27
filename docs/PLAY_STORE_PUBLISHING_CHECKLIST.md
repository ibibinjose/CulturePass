# Google Play Store Publishing Checklist

## 1. App Metadata & Assets
- [ ] App name (30 chars), Short description (80 chars), Full description (4000 chars)
- [ ] High-res icon (512x512 PNG)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for phones, 7" and 10" tablets (min 2, recommended 8+)
- [ ] Promotional video (optional)
- [ ] Privacy Policy URL (must be live and accessible)
- [ ] Contact details, website

## 2. Technical & Build Requirements
- [ ] Unique Package name (au.culturepass.app)
- [ ] Signed with production keystore (upload or Play App Signing)
- [ ] Target SDK 33+ (current is 35 — good)
- [ ] Min SDK 26 (good)
- [ ] All permissions declared with justification in Play Console
- [ ] 64-bit native libraries included
- [ ] No debuggable=true in release
- [ ] Supports Android 8.0+ (API 26)

## 3. Compliance & Legal
- [ ] Content rating questionnaire completed
- [ ] Data safety section filled accurately (ads, data collection, sharing)
- [ ] Privacy policy that covers all data practices
- [ ] No misleading functionality, no spam, policy compliant
- [ ] Accessibility declaration if claiming accessibility

## 4. Performance & Quality
- [ ] App launches < 5s on average devices
- [ ] Handles configuration changes, low memory, poor connectivity
- [ ] Battery optimization compliant
- [ ] Works in split-screen, foldables, different DPIs
- [ ] No crashes or ANRs in pre-launch report

## 5. EAS / Android Specific
- [ ] Production profile in eas.json with correct env vars and buildType: app-bundle
- [ ] Successful EAS production build (AAB recommended)
- [ ] Internal testing track used before production release
- [ ] Pre-launch report reviewed (crashes, ANRs, accessibility)

## 6. Store Listing Optimization
- [ ] Localized listings for major markets (EN, etc.)
- [ ] Keywords naturally in description
- [ ] High-quality, compliant graphics
- [ ] "What's New" updated for each release

**Current CulturePass Status (2026-05-27):**
- Package name correct.
- Good target/min SDK.
- Assets present (android icons).
- Privacy policy stub exists but not hosted publicly yet.
- Console.* usage high — risk of leaking sensitive info in logs.
- Some dependency vulns (xmldom high severity).
- Widgets not relevant for Android (but Live Activities / widgets on iOS are fine).
- EAS Android production profile exists.

**Gaps:** Public privacy policy URL required. Dependency vulnerabilities need addressing or justification. High logging in production code.
