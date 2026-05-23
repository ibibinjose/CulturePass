/**
 * useShareProfile Hook
 *
 * Manages social sharing functionality for host profiles.
 * Provides platform-specific share actions, link generation,
 * embeddable widget code, and share event tracking.
 *
 * Features:
 * - Share to Facebook, Twitter, LinkedIn, WhatsApp, Email
 * - Copy link to clipboard
 * - Generate platform-specific share text
 * - Track share events in analytics
 * - Generate embeddable widget code
 * - Native share sheet support on mobile
 *
 * Usage:
 * ```tsx
 * const { shareToFacebook, shareToTwitter, copyLink, getWidgetCode } = useShareProfile({
 *   profileId: 'abc123',
 *   handle: 'my-venue',
 *   name: 'My Venue',
 *   tagline: 'Best venue in Sydney',
 *   heroImageUrl: 'https://...',
 * });
 * ```
 *
 * Validates: Requirements 31
 */

import { useCallback, useState } from 'react';
import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { siteUrl } from '@/lib/publicPaths';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SharePlatform =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'whatsapp'
  | 'email'
  | 'copy-link'
  | 'native';

export interface ShareProfileConfig {
  /** Profile ID for analytics tracking */
  profileId: string;
  /** Profile handle (URL slug) */
  handle: string;
  /** Profile display name */
  name: string;
  /** Profile tagline for share text */
  tagline?: string;
  /** Hero image URL for Open Graph previews */
  heroImageUrl?: string;
  /** Entity type for context */
  entityType?: string;
}

export interface ShareEvent {
  platform: SharePlatform;
  profileId: string;
  timestamp: string;
  success: boolean;
}

export type WidgetTheme = 'light' | 'dark';
export type WidgetSize = 'compact' | 'full';

export interface WidgetOptions {
  theme: WidgetTheme;
  size: WidgetSize;
}

export interface UseShareProfileReturn {
  /** Share to a specific platform */
  shareTo: (platform: SharePlatform) => Promise<void>;
  /** Copy profile link to clipboard */
  copyLink: () => Promise<void>;
  /** Open native share sheet (mobile) */
  shareNative: () => Promise<void>;
  /** Get the profile URL */
  profileUrl: string;
  /** Get share text for a platform */
  getShareText: (platform: SharePlatform) => string;
  /** Get embeddable widget HTML code */
  getWidgetCode: (options: WidgetOptions) => string;
  /** Whether link was recently copied */
  linkCopied: boolean;
  /** Share event history for this session */
  shareEvents: ShareEvent[];
  /** Whether a share action is in progress */
  isSharing: boolean;
}

// ---------------------------------------------------------------------------
// Share URL Builders
// ---------------------------------------------------------------------------

function buildFacebookShareUrl(profileUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
}

function buildTwitterShareUrl(profileUrl: string, text: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`;
}

function buildLinkedInShareUrl(profileUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
}

function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function buildEmailShareUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShareProfile(config: ShareProfileConfig): UseShareProfileReturn {
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareEvents, setShareEvents] = useState<ShareEvent[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  const profileUrl = siteUrl(`/${config.handle}`);

  const getShareText = useCallback(
    (platform: SharePlatform): string => {
      const tagline = config.tagline || '';
      const name = config.name;

      switch (platform) {
        case 'twitter':
          return tagline
            ? `${name} — ${tagline} ${profileUrl}`
            : `Check out ${name} on CulturePass ${profileUrl}`;
        case 'whatsapp':
          return tagline
            ? `${name} — ${tagline}\n\n${profileUrl}`
            : `Check out ${name} on CulturePass\n\n${profileUrl}`;
        case 'email':
          return tagline
            ? `${name} — ${tagline}\n\nView profile: ${profileUrl}`
            : `Check out ${name} on CulturePass\n\nView profile: ${profileUrl}`;
        case 'linkedin':
        case 'facebook':
        default:
          return tagline
            ? `${name} — ${tagline}`
            : `Check out ${name} on CulturePass`;
      }
    },
    [config.name, config.tagline, profileUrl],
  );

  const trackShareEvent = useCallback(
    (platform: SharePlatform, success: boolean) => {
      const event: ShareEvent = {
        platform,
        profileId: config.profileId,
        timestamp: new Date().toISOString(),
        success,
      };
      setShareEvents((prev) => [...prev, event]);
    },
    [config.profileId],
  );

  const openUrl = useCallback((url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
  }, []);

  const shareTo = useCallback(
    async (platform: SharePlatform) => {
      setIsSharing(true);
      try {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const text = getShareText(platform);

        switch (platform) {
          case 'facebook':
            openUrl(buildFacebookShareUrl(profileUrl));
            break;
          case 'twitter':
            openUrl(buildTwitterShareUrl(profileUrl, text));
            break;
          case 'linkedin':
            openUrl(buildLinkedInShareUrl(profileUrl));
            break;
          case 'whatsapp':
            openUrl(buildWhatsAppShareUrl(text));
            break;
          case 'email':
            openUrl(
              buildEmailShareUrl(
                `${config.name} on CulturePass`,
                text,
              ),
            );
            break;
          case 'copy-link':
            await Clipboard.setStringAsync(profileUrl);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2500);
            break;
          case 'native':
            await Share.share({
              title: config.name,
              message: text,
              url: profileUrl,
            });
            break;
        }

        trackShareEvent(platform, true);
      } catch {
        trackShareEvent(platform, false);
      } finally {
        setIsSharing(false);
      }
    },
    [config.name, getShareText, openUrl, profileUrl, trackShareEvent],
  );

  const copyLink = useCallback(async () => {
    await shareTo('copy-link');
  }, [shareTo]);

  const shareNative = useCallback(async () => {
    await shareTo('native');
  }, [shareTo]);

  const getWidgetCode = useCallback(
    (options: WidgetOptions): string => {
      const { theme, size } = options;
      const width = size === 'compact' ? '320' : '480';
      const height = size === 'compact' ? '180' : '320';

      return `<!-- CulturePass Profile Widget -->
<iframe
  src="${siteUrl(`/embed/${config.handle}?theme=${theme}&size=${size}`)}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: none; border-radius: 16px; overflow: hidden;"
  title="${config.name} — CulturePass Profile"
  loading="lazy"
  allow="clipboard-write"
></iframe>`;
    },
    [config.handle, config.name],
  );

  return {
    shareTo,
    copyLink,
    shareNative,
    profileUrl,
    getShareText,
    getWidgetCode,
    linkCopied,
    shareEvents,
    isSharing,
  };
}
