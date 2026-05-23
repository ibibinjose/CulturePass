import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type CommunityDetailTab = 'about' | 'events' | 'members';

export const COMMUNITY_DETAIL_TABS: CommunityDetailTab[] = ['about', 'events', 'members'];

export type CommunityMemberItem = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  country?: string | null;
};

export function normalizeCommunityId(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? String(raw[0] ?? '') : String(raw);
}

export function parseCommunityTabParam(raw: string | string[] | undefined): CommunityDetailTab {
  const s = normalizeCommunityId(raw).toLowerCase().trim();
  if ((COMMUNITY_DETAIL_TABS as readonly string[]).includes(s)) return s as CommunityDetailTab;
  return 'about';
}

export function communityTabQuerySuffix(tab: CommunityDetailTab): string {
  if (tab === 'about') return '';
  return `?tab=${encodeURIComponent(tab)}`;
}

export function communityDetailHaptic() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

export function showUnavailableMemberProfileNotice() {
  const message = 'This member has not set up a public profile yet.';
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
    return;
  }
  Alert.alert('Profile unavailable', message);
}

export function communityEventPriceLabel(priceCents?: number, isFree?: boolean): string {
  if (isFree || priceCents === 0) return 'Free';
  if (!priceCents) return '';
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function formatCommunityEventDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
}

export function communityMemberPublicProfileSegment(m: CommunityMemberItem): string | null {
  const uname = (m.username ?? '').trim();
  const uid = (m.id ?? '').trim();
  return uname || uid || null;
}

export function communityBusinessRoute(entityType: string, id: string): string {
  switch (entityType) {
    case 'venue':
      return `/v/${id}`;
    case 'artist':
      return `/artist/${id}`;
    case 'community':
      return `/c/${id}`;
    default:
      return `/b/${id}`;
  }
}
