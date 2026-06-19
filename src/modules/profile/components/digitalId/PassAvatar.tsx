import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FontFamily } from '@/design-system/tokens/theme';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

export type PassAvatarProps = {
  size: number;
  avatarUrl?: string | null;
  recyclingKey?: string | number | null;
  initials: string;
  showRing?: boolean;
  ringWidth?: number;
  affiliation?: { name: string; avatarUrl?: string | null } | null;
  accessibilityLabel?: string;
};

export function PassAvatar({
  size,
  avatarUrl,
  recyclingKey,
  initials,
  showRing = true,
  ringWidth = 4,
  affiliation,
  accessibilityLabel,
}: PassAvatarProps) {
  const outer = showRing ? size + ringWidth * 2 : size;
  const badgeSize = Math.max(18, Math.round(size * 0.32));

  const avatarBody = avatarUrl ? (
    <Image
      source={{ uri: avatarUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={recyclingKey != null ? String(recyclingKey) : avatarUrl ?? undefined}
      accessibilityLabel={accessibilityLabel ?? 'Profile photo'}
    />
  ) : (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.34) }]} accessibilityLabel={accessibilityLabel ?? `Initials ${initials}`}>
        {initials}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {showRing ? (
        <View style={[styles.ring, { width: outer, height: outer, borderRadius: outer / 2, padding: ringWidth }]}>
          <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
            {avatarBody}
          </View>
        </View>
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
          {avatarBody}
        </View>
      )}
      {affiliation ? (
        <View
          style={[styles.badge, { width: badgeSize, height: badgeSize, borderRadius: Math.round(badgeSize * 0.22) }]}
          accessibilityLabel={`Affiliation: ${affiliation.name}`}
        >
          {affiliation.avatarUrl ? (
            <Image source={{ uri: affiliation.avatarUrl }} style={styles.badgeImage} contentFit="cover" />
          ) : (
            <Ionicons name="business-outline" size={Math.round(badgeSize * 0.55)} color="#78716C" />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  ring: {
    backgroundColor: WALLET_PASS_THEME.whiteHex,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WALLET_PASS_THEME.whiteHex,
  },
  initials: {
    fontFamily: FontFamily.bold,
    color: '#4F46E5',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 1.5,
    borderColor: WALLET_PASS_THEME.whiteHex,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeImage: { width: '100%', height: '100%' },
});