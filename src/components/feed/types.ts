import type { EventData, Community } from '@/shared/schema';

export type FeedFilter = 'for-you' | 'events' | 'communities';

export type FeedPost = (
  | { id: string; kind: 'event';   event: EventData; community: Community; createdAt: string }
  | {
      id: string;
      kind: 'announcement';
      community: Community;
      body: string;
      postStyle?: 'standard' | 'story';
      authorId?: string;
      imageUrl?: string;
      likesCount?: number;
      commentsCount?: number;
      createdAt: string;
    }
  | { id: string; kind: 'welcome'; community: Community; createdAt: string }
  | { id: string; kind: 'milestone'; community: Community; members: number; createdAt: string }
  | { id: string; kind: 'collection-highlight'; community: Community; tokenName: string; tokenImage: string; userName: string; createdAt: string }
) & { score?: number; matchReason?: string[] };

export type ListItem = FeedPost | { kind: '_trending'; id: string; city: string };
