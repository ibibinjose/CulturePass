# Domain Ownership

> Last reviewed: May 8, 2026.

Canonical domain ownership is rooted in `src/modules/*`.

## Owners by domain

- Discover: `@discover-owner`
- Events: `@events-owner`
- Communities: `@communities-owner`
- Profile: `@profile-owner`
- Admin: `@admin-owner`

## Ownership scope

- Discover: `src/modules/discover/**`
- Events: `src/modules/events/**`
- Communities: `src/modules/communities/**`
- Profile: `src/modules/profile/**`
- Admin: `src/modules/admin/**`

## Notes

- These owners are the default decision-makers for architecture and review in their domain.
- Route files under `src/app/*` should delegate to the corresponding module owner for domain decisions.
- Replace placeholder handles with your GitHub users/teams if needed.
