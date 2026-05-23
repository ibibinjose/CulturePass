/**
 * Breadcrumb navigation utility — pure functions.
 *
 * generateBreadcrumbs: collapses deep navigation paths to at most maxSegments items,
 * preserving the first segment and the last (maxSegments - 2) segments when the path
 * is longer than maxSegments, replacing intermediates with an ellipsis control.
 *
 * Used by web navigation (≥1024px) when depth > 2 from tab root (Requirement 11.3).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BreadcrumbSegment {
  label: string;
  route: string;
  isEllipsis?: boolean;
}

// ---------------------------------------------------------------------------
// generateBreadcrumbs
// ---------------------------------------------------------------------------

/** Sentinel route used for the ellipsis control. */
export const ELLIPSIS_ROUTE = '...' as const;

/**
 * Collapses a navigation path into displayable breadcrumb segments.
 *
 * Rules:
 * - path.length <= maxSegments → return all segments unchanged
 * - path.length > maxSegments →
 *     [first, ellipsis, ...last (maxSegments - 2) segments]
 *     Total = maxSegments items
 *
 * Each element of `navigationPath` is treated as both label and route;
 * callers should pass route strings (e.g. '/events/123') and can derive
 * display labels separately.
 *
 * @param navigationPath - Ordered array of route strings from root to current
 * @param maxSegments - Maximum visible segments including the ellipsis (default 5)
 */
export function generateBreadcrumbs(
  navigationPath: string[],
  maxSegments = 5,
): BreadcrumbSegment[] {
  if (navigationPath.length === 0) return [];
  if (maxSegments < 1) return [];

  // Short enough to show all
  if (navigationPath.length <= maxSegments) {
    return navigationPath.map((route) => ({ label: route, route }));
  }

  // Truncate: first + ellipsis + last (maxSegments - 2)
  // Edge: maxSegments = 1 → only the first segment (no room for ellipsis)
  if (maxSegments === 1) {
    return [{ label: navigationPath[0]!, route: navigationPath[0]! }];
  }

  const tailCount = Math.max(0, maxSegments - 2);
  const first = navigationPath[0]!;
  // slice(-0) === slice(0) returns the full array — guard explicitly
  const tail = tailCount > 0 ? navigationPath.slice(-tailCount) : [];

  return [
    { label: first, route: first },
    { label: '…', route: ELLIPSIS_ROUTE, isEllipsis: true },
    ...tail.map((route) => ({ label: route, route })),
  ];
}
