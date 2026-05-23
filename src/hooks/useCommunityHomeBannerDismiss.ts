import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CommunityHomeBanner, CommunityHomeBannerDismissState } from '@/shared/schema/communityHomeBanner';
import { useAuth } from '@/lib/auth';

const STORAGE_PREFIX = '@cp_community_home_banner_dismiss';

function storageKey(userId: string | null) {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

async function readDismiss(userId: string | null): Promise<CommunityHomeBannerDismissState | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CommunityHomeBannerDismissState;
    if (typeof parsed.bannerId === 'string' && typeof parsed.revision === 'number') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function shouldShowBanner(
  banner: CommunityHomeBanner | undefined,
  dismiss: CommunityHomeBannerDismissState | null,
): boolean {
  if (!banner?.title?.trim()) return false;
  if (!dismiss) return true;
  if (dismiss.bannerId !== banner.id) return true;
  return dismiss.revision < banner.revision;
}

export function useCommunityHomeBannerDismiss(banner: CommunityHomeBanner | undefined) {
  const { userId } = useAuth();
  const [dismiss, setDismiss] = useState<CommunityHomeBannerDismissState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    readDismiss(userId).then((state) => {
      if (!cancelled) {
        setDismiss(state);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const visible = loaded && shouldShowBanner(banner, dismiss);

  const dismissBanner = useCallback(() => {
    if (!banner) return;
    const next: CommunityHomeBannerDismissState = {
      bannerId: banner.id,
      revision: banner.revision,
    };
    setDismiss(next);
    AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch(() => {});
  }, [banner, userId]);

  return { visible, dismissBanner, loaded };
}
