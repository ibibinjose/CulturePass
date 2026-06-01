/** Stored on older events before Kids / Family split */
export const LEGACY_CHILDREN_FAMILY_CATEGORY = 'Children & Family' as const;

/**
 * Values to pass to Firestore `category` equality / `in` for a browse filter.
 * Includes legacy so older documents still match Kids / Family lanes.
 */
export function firestoreCategoryValuesForFilter(filterCategory: string): string[] {
  const f = filterCategory.trim();
  if (!f) return [];
  if (f === 'Kids & Youth') return ['Kids & Youth', LEGACY_CHILDREN_FAMILY_CATEGORY];
  if (f === 'Family') return ['Family', LEGACY_CHILDREN_FAMILY_CATEGORY];
  if (f === LEGACY_CHILDREN_FAMILY_CATEGORY) {
    return ['Kids & Youth', 'Family', LEGACY_CHILDREN_FAMILY_CATEGORY];
  }
  if (f === 'classes') {
    return ['Classes', 'Wellness', 'Fitness', 'Workouts', 'Dance', 'Yoga', 'Tango', 'Meditation', 'Gym', 'Sports', 'activities', 'workshop'];
  }
  return [f];
}

/** In-memory / search: event.category satisfies the requested filter */
export function eventMatchesCategoryFilter(
  eventCategory: string | undefined,
  filterCategory: string | undefined,
): boolean {
  if (!filterCategory?.trim()) return true;
  const ec = String(eventCategory ?? '').trim();
  if (!ec) return false;
  const allowed = firestoreCategoryValuesForFilter(filterCategory);
  const lower = ec.toLowerCase();
  return allowed.some((a) => a.toLowerCase() === lower);
}
