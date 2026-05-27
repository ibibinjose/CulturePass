# Apple App Store Publishing Checklist

## 1. App Metadata & Assets
- [ ] App Name, Subtitle, Primary/Secondary Category
- [ ] Full description (up to 4000 chars), What's New
- [ ] Keywords (100 chars max)
- [ ] Screenshots for all required sizes (iPhone 6.7", 6.5", 5.5", iPad Pro 12.9", etc.)
- [ ] App Icon (1024x1024 PNG, no alpha)
- [ ] App Preview videos (optional but recommended)
- [ ] Privacy Policy URL (must be live)
- [ ] Support URL
- [ ] Marketing URL (optional)

## 2. Technical & Build Requirements
- [ ] Valid Bundle ID (au.culturepass.app)
- [ ] Proper signing: Distribution Certificate + Provisioning Profiles for all targets (main + WidgetsTarget)
- [ ] Capabilities enabled correctly (Push Notifications, App Groups for widgets, etc.)
- [ ] Privacy Manifest (PrivacyInfo.xcprivacy) present and complete
- [ ] App Transport Security (ATS) compliant or exceptions justified
- [ ] Supports iOS 16.4+ (deployment target in config)
- [ ] No private APIs, no crashes on launch
- [ ] 64-bit only, no deprecated APIs

## 3. Compliance & Legal
- [ ] Age Rating questionnaire completed accurately
- [ ] Export Compliance (if using encryption)
- [ ] Apple Sign In implemented if using third-party sign-in
- [ ] ATT (App Tracking Transparency) prompt if tracking
- [ ] Data collection disclosure in App Store Connect (Privacy Nutrition Label)
- [ ] No misleading claims, no spam, content guidelines compliant

## 4. Performance & Quality
- [ ] App launches quickly, no excessive launch time
- [ ] Handles poor network, offline states gracefully
- [ ] Battery/CPU usage reasonable
- [ ] Works on all supported devices and orientations
- [ ] Accessibility: VoiceOver, Dynamic Type, sufficient contrast

## 5. Widgets & Extensions (Critical for this app)
- [ ] WidgetKit / Live Activities configured correctly
- [ ] App Groups entitlement for shared data
- [ ] Widget targets built and included (ExpoWidgetsTarget)
- [ ] Widget screenshots and descriptions in App Store

## 6. EAS / Build Specific
- [ ] Production profile in eas.json with correct env vars
- [ ] Credentials uploaded to EAS or managed via Apple
- [ ] Successful production build on EAS
- [ ] TestFlight internal testing passed before public release

## 7. Post-Submission
- [ ] Respond to App Review feedback within 7 days
- [ ] Monitor crash reports in Xcode Organizer / App Store Connect
- [ ] Update Privacy Nutrition Label if data collection changes

**Current CulturePass Status (as of 2026-05-27 audit):**
- Bundle ID correct.
- Two targets with credentials set up.
- Privacy manifest exists in ios/.
- Widgets configured.
- Many console.* statements in src/ (risk for review if they leak in prod).
- Good icons and assets present.
- No dedicated privacy policy page in public web assets (needs hosting at culturepass.app/legal/privacy).
- Some high/critical vulns in transitive deps (xmldom, uuid) — should run `npm audit fix` or justify before submission.

**Gaps:** Missing live privacy policy/terms at required URLs. High console usage in production code. Dependency vulns.
