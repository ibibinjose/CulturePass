# Smart Business Cards (Apple & Google Wallet)

> Last reviewed: May 8, 2026.

This project already includes a working Smart Business Card flow for both Apple Wallet and Google Wallet.

## What is implemented

- Backend wallet pass service in `functions/src/services/walletPasses.ts`
- Apple Wallet web service registration hooks in `functions/src/services/appleWalletWebService.ts`
- API routes in `functions/src/app.ts`:
  - `GET /api/wallet/business-card/apple`
  - `GET /api/wallet/business-card/apple/pass`
  - `GET /api/wallet/business-card/google`
  - `POST /api/admin/wallet/business-card/google/bootstrap-class`
  - Apple web service routes under `/api/wallet/apple/v1/*`
- Frontend trigger buttons in `app/payment/wallet.tsx`
- API client helpers in `lib/api.ts` (`api.wallet.businessCardApple`, `api.wallet.businessCardGoogle`)

## One-time setup

1. Create `functions/.env` from `functions/.env.example`.
2. Fill all Apple + Google Wallet variables.
3. For Google Wallet, run the bootstrap endpoint once as admin:
   - `POST /api/admin/wallet/business-card/google/bootstrap-class`
4. Verify environment readiness as admin:
   - `GET /api/admin/wallet/business-card/readiness`
5. Deploy functions:
   - `npm run functions:build`
   - `firebase deploy --only functions`

## Apple prerequisites

- Apple Developer Pass Type ID configured
- WWDR certificate
- Pass signer certificate + private key in PEM format
- Team ID

## Google prerequisites

- Google Wallet issuer configured
- Service account with wallet access
- Issuer ID and Generic Class ID configured

## Quick verification

1. Sign in on a test user.
2. Open wallet screen (`/payment/wallet`).
3. Tap **Apple Wallet** (iOS) or **Google Wallet**.
4. Confirm wallet add flow opens and pass details show:
   - Member name
   - CulturePass ID
   - Profile QR code link

## Common failures

- Missing env vars: backend returns `Missing required env var: ...`
- Invalid PEM formatting: ensure proper line breaks or base64 PEM input
- Google class not found: call bootstrap endpoint before generating save URL
- Apple auth mismatch on updates: ensure `APPLE_PASS_AUTH_TOKEN_SECRET` (or fallback secret) is stable across deploys
