/**
 * Feed interaction service — comments, likes, post creation.
 *
 * All mutations are persisted to Firestore via the `/api/feed/*` routes.
 * Optimistic in-memory state is maintained for instant UI feedback while the
 * async API call completes. Subscribers are notified on every state change.
 *
 * The `events` collection path is kept for forward-compatibility but
 * API calls are only made for `communityPosts` which have backend support.
 */

import { api } from '@/lib/api';
import type { FeedComment } from '@/lib/api';

export type { FeedComment };
export type PostCollection = 'events' | 'communityPosts';

type Unsubscribe = () => void;
type CommentSubscriber = (comments: FeedComment[]) => void;
type NumberSubscriber = (value: number) => void;
type BooleanSubscriber = (value: boolean) => void;

interface PostState {
  comments: FeedComment[];
  likedBy: Set<string>;
}

const stateByPost          = new Map<string, PostState>();
const commentsSubscribers  = new Map<string, Set<CommentSubscriber>>();
const likeCountSubscribers = new Map<string, Set<NumberSubscriber>>();
const commentCountSubs     = new Map<string, Set<NumberSubscriber>>();
const likedSubscribers     = new Map<string, Map<string, Set<BooleanSubscriber>>>();

// Community post IDs in the feed are prefixed with "post-" (e.g. "post-abc123").
// Strip the prefix to get the Firestore document ID for API calls.
function firestoreId(postId: string): string {
  return postId.startsWith('post-') ? postId.slice(5) : postId;
}

function key(postId: string, collection: PostCollection): string {
  return `${collection}:${postId}`;
}

function ensureState(postKey: string): PostState {
  const existing = stateByPost.get(postKey);
  if (existing) return existing;
  const created: PostState = { comments: [], likedBy: new Set<string>() };
  stateByPost.set(postKey, created);
  return created;
}

function emitComments(postKey: string, comments: FeedComment[]): void {
  commentsSubscribers.get(postKey)?.forEach(cb => cb([...comments]));
}

function emitLikeCount(postKey: string, count: number): void {
  likeCountSubscribers.get(postKey)?.forEach(cb => cb(count));
}

function emitCommentCount(postKey: string, count: number): void {
  commentCountSubs.get(postKey)?.forEach(cb => cb(count));
}

function emitLiked(postKey: string, userId: string, liked: boolean): void {
  likedSubscribers.get(postKey)?.get(userId)?.forEach(cb => cb(liked));
}

function subscribeSet<T>(map: Map<string, Set<T>>, postKey: string, cb: T): Unsubscribe {
  const bucket = map.get(postKey) ?? new Set<T>();
  bucket.add(cb);
  map.set(postKey, bucket);
  return () => {
    bucket.delete(cb);
    if (bucket.size === 0) map.delete(postKey);
  };
}

// ---------------------------------------------------------------------------
// createCommunityPost — persisted to Firestore
// ---------------------------------------------------------------------------

export async function createCommunityPost(payload: {
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  body: string;
  imageUrl?: string;
  postStyle?: 'standard' | 'story';
}): Promise<void> {
  await api.feed.createPost({
    communityId:   payload.communityId,
    communityName: payload.communityName,
    body:          payload.body,
    imageUrl:      payload.imageUrl,
    postStyle:     payload.postStyle,
  });
}

// ---------------------------------------------------------------------------
// subscribeComments
// ---------------------------------------------------------------------------

export function subscribeComments(
  postId: string,
  collection: PostCollection,
  callback: CommentSubscriber,
): Unsubscribe {
  const postKey = key(postId, collection);
  const state   = ensureState(postKey);

  // Emit current (possibly empty) local state immediately
  callback([...state.comments]);

  const unsub = subscribeSet(commentsSubscribers, postKey, callback);

  // Fetch real comments from the API for community posts
  if (collection === 'communityPosts') {
    api.feed.getComments(firestoreId(postId))
      .then(({ comments }) => {
        state.comments = comments;
        emitComments(postKey, comments);
        emitCommentCount(postKey, comments.length);
      })
      .catch((err: unknown) => {
        if (__DEV__) console.error('[feedService] getComments failed:', err);
      });
  }

  return unsub;
}

// ---------------------------------------------------------------------------
// addComment — optimistic + persisted
// ---------------------------------------------------------------------------

export async function addComment(
  postId: string,
  collection: PostCollection,
  comment: Omit<FeedComment, 'id' | 'createdAt'>,
): Promise<void> {
  const postKey = key(postId, collection);
  const state   = ensureState(postKey);

  // Optimistic local add
  const tempComment: FeedComment = {
    id:        `temp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...comment,
  };
  state.comments = [...state.comments, tempComment];
  emitComments(postKey, state.comments);
  emitCommentCount(postKey, state.comments.length);

  if (collection === 'communityPosts') {
    try {
      const saved = await api.feed.addComment(firestoreId(postId), comment.body);
      // Replace temp with the persisted comment
      state.comments = state.comments.map(c => c.id === tempComment.id ? saved : c);
      emitComments(postKey, state.comments);
    } catch {
      // Keep the optimistic comment if the API call fails
    }
  }
}

// ---------------------------------------------------------------------------
// toggleLike — optimistic + persisted
// ---------------------------------------------------------------------------

export async function toggleLike(
  postId: string,
  collection: PostCollection,
  userId: string,
): Promise<void> {
  const postKey  = key(postId, collection);
  const state    = ensureState(postKey);

  const wasLiked = state.likedBy.has(userId);
  if (wasLiked) {
    state.likedBy.delete(userId);
  } else {
    state.likedBy.add(userId);
  }
  const liked = state.likedBy.has(userId);
  emitLiked(postKey, userId, liked);
  emitLikeCount(postKey, state.likedBy.size);

  if (collection === 'communityPosts') {
    try {
      const result = await api.feed.toggleLike(firestoreId(postId));
      // Sync actual count from server (handles concurrent likes accurately)
      emitLikeCount(postKey, result.likesCount);
    } catch {
      // Revert on error
      if (liked) {
        state.likedBy.delete(userId);
      } else {
        state.likedBy.add(userId);
      }
      emitLiked(postKey, userId, !liked);
      emitLikeCount(postKey, state.likedBy.size);
    }
  }
}

// ---------------------------------------------------------------------------
// subscribeLiked
// ---------------------------------------------------------------------------

export function subscribeLiked(
  postId: string,
  collection: PostCollection,
  userId: string,
  callback: BooleanSubscriber,
): Unsubscribe {
  const postKey = key(postId, collection);
  const state   = ensureState(postKey);
  callback(state.likedBy.has(userId));

  const byUser       = likedSubscribers.get(postKey) ?? new Map<string, Set<BooleanSubscriber>>();
  const userSubs     = byUser.get(userId) ?? new Set<BooleanSubscriber>();
  userSubs.add(callback);
  byUser.set(userId, userSubs);
  likedSubscribers.set(postKey, byUser);

  // Fetch initial like status from API
  if (collection === 'communityPosts') {
    api.feed.getLike(firestoreId(postId))
      .then(({ liked, likesCount }) => {
        if (liked && !state.likedBy.has(userId)) {
          state.likedBy.add(userId);
          emitLiked(postKey, userId, true);
        } else if (!liked && state.likedBy.has(userId)) {
          state.likedBy.delete(userId);
          emitLiked(postKey, userId, false);
        }
        emitLikeCount(postKey, likesCount);
      })
      .catch((err: unknown) => {
        if (__DEV__) console.error('[feedService] getLike failed:', err);
      });
  }

  return () => {
    userSubs.delete(callback);
    if (userSubs.size === 0) byUser.delete(userId);
    if (byUser.size === 0) likedSubscribers.delete(postKey);
  };
}

// ---------------------------------------------------------------------------
// subscribeLikeCount
// ---------------------------------------------------------------------------

export function subscribeLikeCount(
  postId: string,
  collection: PostCollection,
  callback: NumberSubscriber,
): Unsubscribe {
  const postKey = key(postId, collection);
  const state   = ensureState(postKey);
  callback(state.likedBy.size);
  return subscribeSet(likeCountSubscribers, postKey, callback);
}

// ---------------------------------------------------------------------------
// subscribeCommentCount
// ---------------------------------------------------------------------------

export function subscribeCommentCount(
  postId: string,
  collection: PostCollection,
  callback: NumberSubscriber,
): Unsubscribe {
  const postKey = key(postId, collection);
  const state   = ensureState(postKey);
  callback(state.comments.length);
  return subscribeSet(commentCountSubs, postKey, callback);
}

// ---------------------------------------------------------------------------
// reportPost — submits a content report
// ---------------------------------------------------------------------------

export async function reportPost(
  reporterId: string,
  postId: string,
  collection: PostCollection,
  reason: string,
): Promise<void> {
  try {
    await api.raw('POST', `api/posts/${collection}/${encodeURIComponent(firestoreId(postId))}/report`, { reason });
  } catch {
    // Best-effort — don't surface errors to the user
  }
}
