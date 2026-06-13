import type { EventData } from '@/shared/schema';

/** Primary cover image for cards, rails, and detail hero. */
export function getEventCoverImageUrl(
  event: Pick<EventData, 'imageUrl' | 'heroImageUrl'>,
): string | undefined {
  const hero = typeof event.heroImageUrl === 'string' ? event.heroImageUrl.trim() : '';
  const image = typeof event.imageUrl === 'string' ? event.imageUrl.trim() : '';
  return hero || image || undefined;
}