import { api } from '@/lib/api';
import type { DiscoverFeedContract } from '@/shared/schema';

export interface DiscoverFeatureInput {
  userId: string;
  city?: string;
  country?: string;
}

export async function getDiscoverFeatureFeed(input: DiscoverFeatureInput): Promise<DiscoverFeedContract> {
  const feed = await api.discover.feed(input.userId, {
    city: input.city,
    country: input.country,
  });
  return feed;
}
