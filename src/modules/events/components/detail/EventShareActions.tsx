import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useM3Colors } from '@/hooks/useM3Colors';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { pressableA11yRole } from '@/lib/webPressable';

type SharePlatform = 'copy' | 'facebook' | 'twitter' | 'linkedin' | 'pinterest';

const SHARE_OPTIONS: {
  id: SharePlatform;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { id: 'copy', label: 'Copy Link', icon: 'copy-outline', color: '#64748B' },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'twitter', label: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'pinterest', label: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
];

function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

function buildTwitterShareUrl(url: string, text: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

function buildLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

function buildPinterestShareUrl(url: string, description: string): string {
  return `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`;
}

export type EventShareActionsProps = {
  title: string;
  shareUrl: string;
};

export function EventShareActions({ title, shareUrl }: EventShareActionsProps) {
  const m3Colors = useM3Colors();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => {});
      }

      const shareText = `${title} — CulturePass`;

      try {
        if (platform === 'copy') {
          await Clipboard.setStringAsync(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          if (Platform.OS === 'web') {
            Alert.alert('Link copied', 'Event link copied to clipboard.');
          }
          return;
        }

        const url =
          platform === 'facebook'
            ? buildFacebookShareUrl(shareUrl)
            : platform === 'twitter'
              ? buildTwitterShareUrl(shareUrl, shareText)
              : platform === 'linkedin'
                ? buildLinkedInShareUrl(shareUrl)
                : buildPinterestShareUrl(shareUrl, shareText);

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer,width=640,height=480');
        } else {
          openExternalUrl(url);
        }
      } catch {
        Alert.alert('Share unavailable', 'Please try again in a moment.');
      }
    },
    [shareUrl, title],
  );

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>
        Share With Friends
      </Text>
      <View style={styles.row}>
        {SHARE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => handleShare(opt.id)}
            accessibilityRole={pressableA11yRole('button')}
            accessibilityLabel={
              opt.id === 'copy' && copied ? 'Link copied' : `Share on ${opt.label}`
            }
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: m3Colors.surfaceContainerHigh,
                borderColor: m3Colors.outlineVariant,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <Ionicons
              name={opt.icon}
              size={16}
              color={opt.id === 'copy' && copied ? m3Colors.primary : opt.color}
            />
            <Text
              style={[
                styles.chipLabel,
                M3Typography.labelSmall,
                { color: m3Colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {opt.id === 'copy' && copied ? 'Copied' : opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  heading: { fontFamily: FontFamily.semibold },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: {
    fontFamily: FontFamily.medium,
    maxWidth: 88,
  },
});