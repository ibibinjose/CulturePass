import type { PostCollection } from '@/lib/feedService';
import type { FeedPost } from './types';

export function getInitials(name: string) {
  return (name || 'C')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function postCollection(kind: FeedPost['kind']): PostCollection {
  return kind === 'event' ? 'events' : 'communityPosts';
}

export function postId(post: FeedPost): string {
  return post.kind === 'event' ? post.event.id : post.id;
}

export function getDateLabel(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - todayMs) / 86_400_000);
  if (diff < 0) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 6) return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
