# Security Role Mapping

> Last reviewed: May 8, 2026.

This document defines how application roles map to Firestore security rule helpers and access levels.

## Source of truth

- Firestore rules file: `firebase/firestore.rules`
- Role claims source: `request.auth.token.role` (and/or `users/{uid}.roles` where relevant)

## App roles

- `user`: standard member account
- `creator`: generic content creator role
- `organizer`: event creator/operator role
- `business`: business operator role
- `sponsor`: sponsor/operator role
- `moderator`: moderation-capable role
- `cityAdmin`: city-scoped administration role
- `platformAdmin`: platform-wide administration role
- `admin`: full administration role

## Rule helper mapping

### `isAdminLike()`

Treats the following as administrative in rules:

- `admin`
- `platformAdmin`
- `cityAdmin`
- `moderator`

### `isCreatorLike()`

Treats the following as creator-capable in rules:

- `creator`
- `organizer`
- `business`
- `sponsor`
- any role in `isAdminLike()`

## Access model by resource

- `users/*`
  - self read/update
  - admin-like can read/update other users
- `cultures/categories/countries/states/cities`
  - public read
  - admin-like write
- `events/communities/businesses/offers`
  - public read
  - create: creator-like
  - update/delete: owner or admin-like
- `indigenousSpotlights/traditionalLands`
  - public read
  - admin-like write
- `indigenousBusinesses`
  - public read
  - create: creator-like
  - update/delete: owner or admin-like
- `subscriptions/savedItems`
  - self read/write
  - delete: self or admin-like
- `moderationQueue`
  - admin-like read/write
- `auditLogs`
  - admin-like read
  - writes blocked in client rules (server-side only)

## Notes

- Prefer server-side authorization checks in API handlers even when Firestore rules exist.
- Keep role semantics synchronized between:
  - auth claims
  - user profile roles
  - Firestore helper functions
- If introducing a new privileged role, update `firebase/firestore.rules` and this file in the same change.
