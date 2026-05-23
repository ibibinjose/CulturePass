import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import type { EventData } from '@/shared/schema';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { Image } from 'expo-image';
import { M3Button } from '@/design-system/ui/M3Button';
import { M3Card } from '@/design-system/ui/M3Card';
import { useM3Colors } from '@/hooks/useM3Colors';

interface HostSectionProps {
  event: EventData;
  organizer: { name: string; avatarUrl?: string | null; website?: string | null; isVerified?: boolean } | null;
  /** When the organiser is a community profile, taps on the host row open `/c/[id]`. */
  hostCommunityPathId?: string | null;
  displayCategory: string;
  canContactOrganizer: boolean;
  contactPending: boolean;
  handleContactOrganizer: () => void;
  handleEmailHost: () => void;
  handleCallHost: () => void;
  handleVisitWebsite: () => void;
  colors: ColorTheme;
  s?: Record<string, unknown>;
}

export function HostSection({
  organizer,
  hostCommunityPathId,
  displayCategory,
  canContactOrganizer,
  contactPending,
  handleContactOrganizer,
  handleEmailHost,
  handleVisitWebsite,
}: HostSectionProps) {
  const m3Colors = useM3Colors();
  if (!organizer?.name) {
    return null;
  }

  const initial = (organizer.name.trim().charAt(0) || '?').toUpperCase();

  const topRow = (
    <View style={styles.topRow}>
      <View style={styles.avatarWrap}>
        {organizer.avatarUrl ? (
          <Image source={{ uri: organizer.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.fallback, { backgroundColor: m3Colors.primaryContainer }]}>
            <Text style={[styles.fallbackText, { color: m3Colors.onPrimaryContainer }]}>{initial}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, M3Typography.titleLarge, { color: m3Colors.onSurface }]}>{organizer.name}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: m3Colors.secondaryContainer }]}>
            <Text style={[styles.badgeText, { color: m3Colors.onSecondaryContainer }]}>{displayCategory.toUpperCase()}</Text>
          </View>
          {organizer.isVerified ? (
            <View style={[styles.badge, { backgroundColor: m3Colors.tertiaryContainer }]}>
              <Ionicons name="shield-checkmark" size={10} color={m3Colors.onTertiaryContainer} />
              <Text style={[styles.badgeText, { color: m3Colors.onTertiaryContainer }]}>VERIFIED</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <M3Card variant="filled" style={styles.hostCard}>
        {hostCommunityPathId ? (
          <Pressable
            onPress={() => router.push({ pathname: '/c/[id]', params: { id: hostCommunityPathId } })}
            accessibilityRole="link"
            accessibilityLabel={`Open ${organizer.name} community`}
            style={({ pressed }) => [pressed && { opacity: 0.92 }, Platform.OS === 'web' && { cursor: 'pointer' as const }]}
          >
            {topRow}
          </Pressable>
        ) : (
          topRow
        )}

        <View style={styles.actions}>
            {canContactOrganizer && (
                <M3Button
                    variant="filled"
                    leftIcon="chatbubble-outline"
                    onPress={handleContactOrganizer}
                    loading={contactPending}
                    fullWidth
                >
                    Contact Organiser
                </M3Button>
            )}
            <View style={styles.secondaryActions}>
                <View style={{ flex: 1 }}>
                    <M3Button variant="tonal" leftIcon="mail-outline" onPress={handleEmailHost} fullWidth>Email</M3Button>
                </View>
                {organizer.website ? (
                    <View style={{ flex: 1 }}>
                        <M3Button variant="tonal" leftIcon="globe-outline" onPress={handleVisitWebsite} fullWidth>Website</M3Button>
                    </View>
                ) : null}
            </View>
        </View>
    </M3Card>
  );
}

const styles = StyleSheet.create({
  hostCard: { padding: 20, gap: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontSize: 24, fontFamily: FontFamily.bold },
  info: { flex: 1, gap: 4 },
  name: { letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5 },
  actions: { gap: 12 },
  secondaryActions: { flexDirection: 'row', gap: 12 },
});
