/**
 * Feed route — GET /api/feed + community post CRUD
 *
 * Ranking signals:
 *   Cultural Relevance (30%) · Date Proximity (25%) · Location (15%)
 *   Interest Match (12%)     · Community Affinity (10%)
 *   Followed profiles (12%)  · Followed venue profile (6%) — Phase 3
 *   Social Proof (5%)        · Freshness Decay (8%)
 *
 * All community post data is read/written from the `communityPosts` Firestore
 * collection — no hardcoded placeholder content is generated.
 */

import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { eventsService, profilesService, usersService } from '../services/firestore';
import { isFirestoreConfigured, db } from '../admin';
import { requireAuth, isOwnerOrAdmin } from '../middleware/auth';
import type { UserRole } from '../../../shared/schema';
import type { FirestoreEvent } from '../services/firestore';

export const feedRouter = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const STORY_POST_ROLES: UserRole[] = ['organizer', 'business', 'admin', 'platformAdmin'];

interface CommunityPost {
  id: string;
  communityId: string;
  communityName: string;
  communityImageUrl?: string | null;
  authorId: string;
  authorName: string;
  body: string;
  imageUrl?: string | null;
  /** 'story' = tall story-style status (only org / business / admin may create). */
  postStyle?: 'standard' | 'story';
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  deletedAt?: string | null;
}

interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  body: string;
  createdAt: string;
}

type FeedItem = {
  id: string;
  kind: 'event' | 'announcement';
  score: number;
  matchReasons: string[];
  // event payload
  event?: FirestoreEvent;
  // shared community / post fields
  communityId?: string;
  communityName?: string;
  communityImageUrl?: string | null;
  body?: string;
  imageUrl?: string | null;
  postStyle?: 'standard' | 'story';
  authorId?: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
};

type UserContext = {
  city: string;
  interests: string[];
  culturalIdentity: { nationalityId?: string; cultureIds?: string[]; languageIds?: string[] };
  followingIds: Set<string>;
  /** Profile ids the user follows (`follows` collection, targetType === 'profile') */
  followingProfileIds: Set<string>;
};

// ---------------------------------------------------------------------------
// Ranking helpers
// ---------------------------------------------------------------------------

function scoreItem(item: FeedItem, user: UserContext, todayMs: number): number {
  let score = 0;

  // 1. Cultural Relevance (30%)
  if (item.event) {
    const cultureTags  = item.event.cultureTag  ?? [];
    const languageTags = (item.event as any).languageTags ?? [];
    const cid = user.culturalIdentity;

    let cultureRaw = 0;
    const cultureOverlap = cultureTags.some((t: string) => {
      const lt = t.toLowerCase();
      return lt === cid.nationalityId?.toLowerCase()
        || cid.cultureIds?.some((id: string) => id.toLowerCase() === lt);
    });
    const languageOverlap = languageTags.some((t: string) =>
      cid.languageIds?.some((id: string) => id.toLowerCase() === t.toLowerCase()),
    );

    if (cultureOverlap)  cultureRaw += 0.8;
    if (languageOverlap) cultureRaw += 0.2;
    if (cultureRaw > 0) {
      score += cultureRaw * 0.30;
      item.matchReasons.push('Matches your culture');
    }
  }

  // 2. Date Proximity (25%)
  if (item.event?.date) {
    const eventMs  = new Date(item.event.date).setHours(0, 0, 0, 0);
    const diffDays = (eventMs - todayMs) / 86_400_000;
    if (diffDays >= 0 && diffDays < 1)  { score += 0.35; item.matchReasons.unshift('Happening today!'); }
    else if (diffDays < 3)              { score += 0.25; item.matchReasons.unshift('Happening soon'); }
    else if (diffDays <= 7)             { score += 0.12; item.matchReasons.unshift('This week'); }
    else if (diffDays > 90)             { score -= 0.08; }
  }

  // 3. Location Relevance (15%)
  const itemCity = (item.event?.city ?? '').toLowerCase();
  if (itemCity && itemCity === user.city.toLowerCase()) {
    score += 0.15;
  } else if (itemCity) {
    score += 0.04;
  }

  // 4. Interest Matching (12%)
  if (item.event) {
    const tags = item.event.tags ?? [];
    let matchCount = 0;
    tags.forEach((tag: string) => { if (user.interests.includes(tag.toLowerCase())) matchCount++; });
    if (matchCount > 0) {
      score += Math.min(1, matchCount / 3) * 0.12;
      item.matchReasons.push(`${matchCount} interest match${matchCount > 1 ? 'es' : ''}`);
    }
  }

  // 5. Community Affinity (10%)
  if (item.communityId && user.followingIds.has(item.communityId)) {
    score += 0.10;
    item.matchReasons.push('From your communities');
  }

  // 5b. Followed organiser / venue profiles (Phase 3 — profile-first discovery)
  if (
    item.event?.publisherProfileId &&
    user.followingProfileIds.has(item.event.publisherProfileId)
  ) {
    score += 0.12;
    item.matchReasons.push('From a profile you follow');
  }
  if (
    item.event?.venueProfileId &&
    user.followingProfileIds.has(item.event.venueProfileId)
  ) {
    score += 0.06;
    item.matchReasons.push('At a venue you follow');
  }

  // 6. Social Proof (5%)
  if (item.kind === 'event' && item.event) {
    score += Math.min(1, (item.event.attending ?? 0) / 500) * 0.05;
  }

  // 7. Freshness Decay (8%)
  const ageHrs    = (Date.now() - new Date(item.createdAt).getTime()) / 3_600_000;
  const freshness = Math.exp(-ageHrs / 168); // half-life ~1 week
  score += freshness * 0.08;

  return score;
}

// ---------------------------------------------------------------------------
// Helper: fetch real community posts from Firestore
// ---------------------------------------------------------------------------

async function fetchFollowedProfileIds(userId: string): Promise<Set<string>> {
  if (!isFirestoreConfigured) return new Set();
  try {
    const snap = await db.collection('follows').where('userId', '==', userId).limit(500).get();
    const ids = new Set<string>();
    for (const doc of snap.docs) {
      const data = doc.data() as { targetType?: string; targetId?: string };
      if (data.targetType === 'profile' && typeof data.targetId === 'string' && data.targetId) {
        ids.add(data.targetId);
      }
    }
    return ids;
  } catch {
    return new Set();
  }
}

async function fetchCommunityPosts(limit = 40): Promise<CommunityPost[]> {
  if (!isFirestoreConfigured) return [];
  try {
    // Fetch without a deletedAt filter to avoid requiring a composite index.
    // Filter soft-deleted posts in memory.
    const snap = await db.collection('communityPosts')
      .orderBy('createdAt', 'desc')
      .limit(limit * 2)
      .get();
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost))
      .filter(p => !p.deletedAt)
      .slice(0, limit);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// GET /api/feed
// ---------------------------------------------------------------------------

feedRouter.get('/feed', async (req: Request, res: Response) => {
  const city     = String(req.query.city    ?? '').trim();
  const country  = String(req.query.country ?? '').trim();
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '30'), 10) || 30));
  const page     = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);

  try {
    // 1. Fetch events, communities, and real community posts in parallel
    const [eventsResult, communitiesResult, communityPosts] = await Promise.all([
      eventsService.list(
        // Avoid composite index dependency for feed endpoint by querying published events only,
        // then applying city/country filters in memory.
        { status: 'published' as any },
        { page: 1, pageSize: 60 },
      ),
      profilesService.list({ entityType: 'community', city: city || undefined }),
      fetchCommunityPosts(40),
    ]);

    const events      = eventsResult.items.filter((event) => {
      const cityOk = !city || (event.city ?? '').toLowerCase() === city.toLowerCase();
      const countryOk = !country || (event.country ?? '').toLowerCase() === country.toLowerCase();
      return cityOk && countryOk;
    });
    const communities = communitiesResult;

    // 2. Resolve user context for personalised ranking
    let userCtx: UserContext = {
      city: city || 'Sydney',
      interests: [],
      culturalIdentity: {},
      followingIds: new Set(),
      followingProfileIds: new Set(),
    };

    if (isFirestoreConfigured && req.user?.id) {
      const followingProfileIds = await fetchFollowedProfileIds(req.user.id);
      const profile = await usersService.getById(req.user.id);
      if (profile) {
        userCtx = {
          city: profile.city ?? city ?? 'Sydney',
          interests: (profile.interests ?? []).map((i: string) => i.toLowerCase()),
          culturalIdentity: (profile as any).culturalIdentity ?? {},
          followingIds: new Set(profile.communities ?? []),
          followingProfileIds,
        };
      } else {
        userCtx = {
          ...userCtx,
          followingProfileIds,
        };
      }
    }

    // Build a community lookup map for resolving community info on posts
    const communityMap = new Map(communities.map(c => [c.id, c]));

    const now   = Date.now();
    const items: FeedItem[] = [];

    // Event cards — each event is attributed to its own communityId if set
    events.forEach((event, i) => {
      const comm = event.communityId
        ? communityMap.get(event.communityId)
        : communities[i % Math.max(communities.length, 1)];
      items.push({
        id: `ev-${event.id}`,
        kind: 'event',
        score: 0,
        matchReasons: [],
        event,
        communityId:       comm?.id,
        communityName:     comm?.name,
        communityImageUrl: comm?.imageUrl ?? null,
        createdAt: event.createdAt ?? new Date(now - i * 3_600_000).toISOString(),
      });
    });

    // Real community posts from Firestore
    communityPosts.forEach(post => {
      const comm = communityMap.get(post.communityId);
      items.push({
        id:                post.id,
        kind:              'announcement',
        score:             0,
        matchReasons:      [],
        communityId:       post.communityId,
        communityName:     comm?.name ?? post.communityName,
        communityImageUrl: comm?.imageUrl ?? post.communityImageUrl ?? null,
        body:              post.body,
        imageUrl:          post.imageUrl ?? null,
        postStyle:         post.postStyle === 'story' ? 'story' : undefined,
        authorId:          post.authorId,
        likesCount:        post.likesCount,
        commentsCount:     post.commentsCount,
        createdAt:         post.createdAt,
      });
    });

    // 3. Rank
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const ranked  = items
      .map(item => ({ ...item, score: scoreItem(item, userCtx, todayMs) }))
      .sort((a, b) => b.score - a.score);

    // 4. Paginate
    const total     = ranked.length;
    const offset    = (page - 1) * pageSize;
    const paginated = ranked.slice(offset, offset + pageSize);

    return res.json({ items: paginated, total, page, pageSize, hasNextPage: offset + pageSize < total });
  } catch (err) {
    captureRouteError(err, 'GET /api/feed');
    return res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/feed/posts — create a community post
// ---------------------------------------------------------------------------

feedRouter.post('/feed/posts', requireAuth, async (req: Request, res: Response) => {
  const { communityId, communityName, body, imageUrl, postStyle: rawStyle } = req.body ?? {};
  const postStyle: 'standard' | 'story' = rawStyle === 'story' ? 'story' : 'standard';

  if (!communityId || typeof communityId !== 'string') {
    return res.status(400).json({ error: 'communityId is required' });
  }
  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    return res.status(400).json({ error: 'body is required' });
  }
  const trimmed = body.trim();
  if (postStyle === 'story') {
    if (!STORY_POST_ROLES.includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (trimmed.length > 280) {
      return res.status(400).json({ error: 'Story must be 280 characters or less' });
    }
  } else if (trimmed.length > 500) {
    return res.status(400).json({ error: 'body must be 500 characters or less' });
  }

  try {
    const ref = db.collection('communityPosts').doc();
    const now = new Date().toISOString();
    const post: CommunityPost = {
      id:                ref.id,
      communityId:       String(communityId),
      communityName:     communityName ? String(communityName) : '',
      communityImageUrl: null,
      authorId:          req.user!.id,
      authorName:        req.user!.username || req.user!.email || 'User',
      body:              trimmed,
      imageUrl:          imageUrl ? String(imageUrl) : null,
      postStyle:         postStyle === 'story' ? 'story' : undefined,
      likesCount:        0,
      commentsCount:     0,
      createdAt:         now,
      deletedAt:         null,
    };
    await ref.set(post);
    return res.status(201).json(post);
  } catch (err) {
    captureRouteError(err, 'POST /api/feed/posts');
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/feed/posts/:id — soft-delete own post
// ---------------------------------------------------------------------------

feedRouter.delete('/feed/posts/:id', requireAuth, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const ref  = db.collection('communityPosts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Post not found' });

    const post = snap.data() as CommunityPost;
    if (!isOwnerOrAdmin(req.user!, post.authorId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await ref.update({ deletedAt: new Date().toISOString() });
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/feed/posts/:id');
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/feed/posts/:id/comments
// ---------------------------------------------------------------------------

feedRouter.get('/feed/posts/:id/comments', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const snap = await db.collection('communityPosts').doc(id)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get();
    const comments: PostComment[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostComment));
    return res.json({ comments });
  } catch (err) {
    captureRouteError(err, 'GET /api/feed/posts/:id/comments');
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/feed/posts/:id/comments
// ---------------------------------------------------------------------------

feedRouter.post('/feed/posts/:id/comments', requireAuth, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { body } = req.body ?? {};

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    return res.status(400).json({ error: 'body is required' });
  }

  try {
    const postRef  = db.collection('communityPosts').doc(id);
    const postSnap = await postRef.get();
    if (!postSnap.exists || (postSnap.data() as CommunityPost).deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentRef = postRef.collection('comments').doc();
    const comment: PostComment = {
      id:          commentRef.id,
      authorId:    req.user!.id,
      authorName:  req.user!.username || req.user!.email || 'User',
      authorAvatar: null,
      body:        body.trim(),
      createdAt:   new Date().toISOString(),
    };

    const currentCount = (postSnap.data() as CommunityPost).commentsCount ?? 0;
    await Promise.all([
      commentRef.set(comment),
      postRef.update({ commentsCount: currentCount + 1 }),
    ]);

    return res.status(201).json(comment);
  } catch (err) {
    captureRouteError(err, 'POST /api/feed/posts/:id/comments');
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/feed/posts/:id/like — toggle like
// ---------------------------------------------------------------------------

feedRouter.post('/feed/posts/:id/like', requireAuth, async (req: Request, res: Response) => {
  const id       = String(req.params.id);
  const userId   = req.user!.id;

  try {
    const postRef  = db.collection('communityPosts').doc(id);
    const likeRef  = postRef.collection('likes').doc(userId);
    const [postSnap, likeSnap] = await Promise.all([postRef.get(), likeRef.get()]);

    if (!postSnap.exists || (postSnap.data() as CommunityPost).deletedAt) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const currentCount = (postSnap.data() as CommunityPost).likesCount ?? 0;

    if (likeSnap.exists) {
      await Promise.all([
        likeRef.delete(),
        postRef.update({ likesCount: Math.max(0, currentCount - 1) }),
      ]);
      return res.json({ liked: false, likesCount: Math.max(0, currentCount - 1) });
    } else {
      await Promise.all([
        likeRef.set({ userId, createdAt: new Date().toISOString() }),
        postRef.update({ likesCount: currentCount + 1 }),
      ]);
      return res.json({ liked: true, likesCount: currentCount + 1 });
    }
  } catch (err) {
    captureRouteError(err, 'POST /api/feed/posts/:id/like');
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/feed/posts/:id/like — get like status for current user
// ---------------------------------------------------------------------------

feedRouter.get('/feed/posts/:id/like', requireAuth, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId  = req.user!.id;

  try {
    const [postSnap, likeSnap] = await Promise.all([
      db.collection('communityPosts').doc(id).get(),
      db.collection('communityPosts').doc(id).collection('likes').doc(userId).get(),
    ]);
    const likesCount = (postSnap.data() as CommunityPost)?.likesCount ?? 0;
    return res.json({ liked: likeSnap.exists, likesCount });
  } catch (err) {
    captureRouteError(err, 'GET /api/feed/posts/:id/like');
    return res.status(500).json({ error: 'Failed to get like status' });
  }
});
