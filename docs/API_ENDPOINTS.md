# CulturePass API Endpoints

This document summarizes the current Firebase Functions API surface used by the app.

**Last verified:** May 8, 2026

## Base URL

- Production direct URL:
  - `https://us-central1-culturepass-4f264.cloudfunctions.net/api/`
- Production app/web (preferred):
  - same-origin `/api/*` (Firebase Hosting rewrite)
- Local emulator:
  - `http://127.0.0.1:5001/<project-id>/us-central1/api/`

## Versioning and route aliases

The API is mounted under all of these prefixes:

- `/` (legacy direct function routes)
- `/api/*` (current standard)
- `/v1/*` (versioned alias)
- `/api/v1/*` (versioned + hosting alias)

New clients should target `/api/v1/*` or `/api/*`.

## Authentication and security

- Most write and user-specific routes require Firebase Auth (`Authorization: Bearer <idToken>`).
- Server middleware includes:
  - CORS allowlist
  - Helmet security headers
  - Rate limiting
  - Moderation checks on selected write paths

## Health

- `GET /health`

## Core route groups

The following routers are mounted and active in `functions/src/app.ts`:

- `auth`
- `events`
- `tickets`
- `users`
- `profiles`
- `activities`
- `movies`
- `shopping`
- `restaurants`
- `locations`
- `cities`
- `calendar`
- `cultureToday`
- `discovery`
- `search`
- `social`
- `feed`
- `offerings`
- `perks`
- `membership`
- `rewards`
- `wallet`
- `uploads`
- `council`
- `indigenous`
- `cultureExplorer`
- `cultureShop`
- `hostApplication`
- `admin`
- `misc`
- `stripe`

## Frequently used endpoints

### Search and discovery

- `GET /api/search`
  - Common query params: `q`, `city`, `country`, `category`, `cultureTag`, `entryType`, `eventType`, `publisherProfileId`, `venueProfileId`, `lgaCode`, `pageSize`
- `GET /api/discover/trending`
- `GET /api/discover/:userId`

### Indigenous

- `GET /api/indigenous/traditional-lands`
- `GET /api/indigenous/spotlights`
- `GET /api/indigenous/organisations`
- `GET /api/indigenous/festivals`
- `GET /api/indigenous/businesses`

### Council (LGA)

- `GET /api/council/list`
- `GET /api/council/resolve`
- `GET /api/council/nearest`
- `GET /api/council/selected` (auth)
- `GET /api/council/my` (auth)
- `POST /api/council/select` (auth)
- `GET /api/council/:id`

### Stripe and payments

- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/refund`
- `POST /api/stripe/webhook`

### Uploads

- `POST /api/uploads/image` (multipart, `image` field)

## Notes

- Endpoint details evolve with handler updates; this file is a high-level reference.
- For exact request/response contracts, inspect:
  - `functions/src/handlers/*.ts`
  - `shared/schema/*`

## Quick verification workflow

Use this before releases or doc updates:

```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# 1) Confirm mounted routers and aliases
rg "mount\\(|createEventsRouter|createIndigenousRouter|createStripeRouter" functions/src/app.ts

# 2) Confirm endpoint paths in handlers
rg "router\\.(get|post|put|patch|delete)\\(" functions/src/handlers

# 3) Optional: smoke test health and key routes (with emulator or prod base URL)
curl "$API_BASE/health"
curl "$API_BASE/search?q=test&pageSize=5"
curl "$API_BASE/council/list"
```
