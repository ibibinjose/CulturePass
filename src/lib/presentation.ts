/**
 * Shared display fallbacks — show every row/section with whatever data exists
 * instead of hiding fields when values are partial or missing.
 */
export const DISPLAY_FALLBACK = {
  location: 'Location TBC',
  venue: 'Venue TBC',
  price: 'Price TBA',
  date: 'Date TBA',
  notListed: 'Not listed yet',
  noDescription: 'No description yet — check back soon for more about this community.',
  noMission: 'Mission statement not added yet.',
  noSocialLinks: 'No social links added yet.',
  noTrustSignals: 'No trust & safety signals listed yet.',
  membersPrivate: 'Member profiles are private',
  membersEmpty: 'No members have joined yet',
  hostedBy: 'Hosted by community',
  organiserLoading: 'Loading organiser…',
  category: 'Cultural event',
  community: 'Independent community',
  eventType: 'Not listed yet',
  organisedBy: 'Organiser details unavailable',
} as const;

export function joinDisplayParts(
  parts: Array<string | null | undefined>,
  separator = ' · ',
  fallback?: string,
): string {
  const clean = parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((s) => s.length > 0);
  if (clean.length > 0) return clean.join(separator);
  return fallback ?? '';
}

export type EventLocationLike = {
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  country?: string | null;
};

export function formatEventLocation(
  event: EventLocationLike,
  options?: { fallback?: string; includeAddress?: boolean },
): string {
  const { fallback = DISPLAY_FALLBACK.location, includeAddress = false } = options ?? {};
  const parts = includeAddress
    ? [event.venue, event.address, event.city, event.state, event.country]
    : [event.venue, event.city, event.state];
  return joinDisplayParts(parts, ' · ', fallback);
}

export function formatEventPriceLabel(
  event: { priceCents?: number; isFree?: boolean; priceLabel?: string | null },
  fallback: string = DISPLAY_FALLBACK.price,
): string {
  if (event.isFree || event.priceCents === 0) return 'Free';
  const label = typeof event.priceLabel === 'string' ? event.priceLabel.trim() : '';
  if (label) return label;
  if (event.priceCents != null && event.priceCents > 0) {
    return `$${(event.priceCents / 100).toFixed(2)}`;
  }
  return fallback;
}

export function displayOrFallback(value: string | null | undefined, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || fallback;
}

export function isFallbackValue(value: string, fallback: string): boolean {
  return value.trim() === fallback;
}

/** True when a label exposes an internal id instead of a human name. */
export function isOrganiserIdPlaceholder(value: string | null | undefined): boolean {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return false;
  if (/^Organiser\s*\([^)]+\)\s*$/i.test(trimmed)) return true;
  if (/^Organizer\s*\([^)]+\)\s*$/i.test(trimmed)) return true;
  if (/^Host\s*\([^)]+\)\s*$/i.test(trimmed)) return true;
  return false;
}

/** Never show Firebase/profile ids in user-facing organiser copy. */
export function sanitizeOrganiserDisplayName(
  value: string | null | undefined,
  fallback: string = DISPLAY_FALLBACK.organisedBy,
): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed || isOrganiserIdPlaceholder(trimmed)) return fallback;
  return trimmed;
}

/** Street-first address line for event detail documents. */
export function formatEventFullAddress(event: EventLocationLike): string {
  const street = joinDisplayParts([event.address, event.venue], ', ');
  const region = joinDisplayParts([event.city, event.state, event.country], ', ');
  return joinDisplayParts([street, region], ', ', DISPLAY_FALLBACK.location);
}

function startCaseLabel(str?: string | null): string {
  if (!str?.trim()) return '';
  return str
    .trim()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type EventLabelSource = {
  eventType?: string | null;
  category?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

/** Human-readable event type (e.g. Festival or Fair from Eventik metadata). */
export function resolveEventTypeLabel(event: EventLabelSource): string {
  const meta = event.metadata;
  const eventikTypes = Array.isArray(meta?.eventikTypes)
    ? (meta.eventikTypes as string[]).map((t) => t.trim()).filter(Boolean)
    : [];
  if (eventikTypes[0]) return eventikTypes[0];

  const eventikCategories = Array.isArray(meta?.eventikCategories)
    ? (meta.eventikCategories as string[]).map((t) => t.trim()).filter(Boolean)
    : [];
  if (eventikCategories[0] && /fair|festival|market/i.test(eventikCategories[0])) {
    return eventikCategories[0];
  }

  if (event.eventType?.trim()) {
    const raw = event.eventType.trim();
    if (raw.includes(' ') || /[&]/.test(raw)) return raw;
    return startCaseLabel(raw);
  }

  const tagHit = (event.tags ?? []).find((t) => /fair|festival/i.test(t));
  if (tagHit) return startCaseLabel(tagHit);

  return DISPLAY_FALLBACK.eventType;
}

/** Display category — prefers explicit category, then mapped event type. */
export function resolveEventCategoryLabel(event: EventLabelSource): string {
  if (event.category?.trim()) return event.category.trim();

  const meta = event.metadata;
  const eventikCategories = Array.isArray(meta?.eventikCategories)
    ? (meta.eventikCategories as string[]).map((t) => t.trim()).filter(Boolean)
    : [];
  if (eventikCategories[0]) return eventikCategories[0];

  if (event.eventType?.trim()) return startCaseLabel(event.eventType);

  return DISPLAY_FALLBACK.category;
}