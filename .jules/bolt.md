## 2026-05-08 - Sidebar Clock Re-render Cost
**Learning:** `WebSidebar` re-renders on a 30-second clock tick, so per-item route normalization in `isActive` runs repeatedly across all nav items and compounds unnecessary string work.
**Action:** Precompute normalized routes with `useMemo` for nav collections and keep `isActive` on O(1) lookups during frequent sidebar refreshes.
