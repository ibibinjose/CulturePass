import type { User } from '@/shared/schema/user';
import { APP_NAME } from '@/lib/app-meta';
import { canonicalUserPath, siteUrl } from '@/lib/publicPaths';

const DEFAULT_PROFILE_IMAGE_URL = siteUrl('/assets/images/social-preview.png'); // business-card themed social preview

type ShareableUser = Pick<User, 'id' | 'handle' | 'handleStatus'> & {
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  culturePassId?: string | null;
};

export function profileDisplayName(user?: { displayName?: string | null; username?: string | null } | null): string {
  return user?.displayName?.trim() || user?.username?.trim() || `${APP_NAME} member`;
}

export function profileShareUrl(user: Pick<User, 'id' | 'handle' | 'handleStatus'> & { culturePassId?: string | null }): string {
  return siteUrl(canonicalUserPath(user));
}

export function profileShareTitle(user: { displayName?: string | null; username?: string | null }): string {
  return `${profileDisplayName(user)} on ${APP_NAME}`;
}

export function profileShareDescription(user: ShareableUser): string {
  const bio = user.bio?.trim().replace(/\s+/g, ' ');
  return bio || `Check out ${profileDisplayName(user)}'s profile on ${APP_NAME}.`;
}

export function profileShareImage(user?: Pick<User, 'avatarUrl'> | null): string {
  const avatarUrl = user?.avatarUrl?.trim();
  // Use the user's profile photo as the share image (appears in link previews as the "profile image").
  // The public profile page + /cpu/ and digital ID present it with full business-card styling / layout.
  // Falls back to a branded social-preview.png (card-like design).
  return avatarUrl && /^https?:\/\//i.test(avatarUrl) ? avatarUrl : DEFAULT_PROFILE_IMAGE_URL;
}

export function profileShareMessage(user: ShareableUser): string {
  return `${profileShareDescription(user)}\n\n${profileShareUrl(user)}`;
}
