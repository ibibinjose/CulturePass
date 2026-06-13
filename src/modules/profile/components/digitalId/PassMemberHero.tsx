import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { FontFamily, CultureTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';

import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

export type PassQuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
};

export type PassMemberHeroProps = {
  name: string;
  username: string;
  cpid: string;
  memberSince: string;
  tierLabel: string;
  tierColor: string;
  avatarUrl?: string | null;
  initials: string;
  panelBg: string;
  panelBorder: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
  copied?: boolean;
  quickActions: PassQuickAction[];
  onCopyCpid: () => void;
};

function PulsingActiveDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.35, { duration: 900 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, [scale]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.activeDot, animStyle, { backgroundColor: color }]} />
  );
}

export function PassMemberHero({
  name,
  username,
  cpid,
  memberSince,
  tierLabel,
  tierColor,
  avatarUrl,
  initials,
  panelBg,
  panelBorder,
  textColor,
  mutedColor,
  accentColor,
  isDark,
  copied,
  quickActions,
  onCopyCpid,
}: PassMemberHeroProps) {
  return (
    <GlassView
      intensity={isDark ? 28 : 12}
      style={[styles.panel, { borderColor: panelBorder, backgroundColor: panelBg }]}
      contentStyle={styles.content}
    >
      <View style={styles.row}>
        <View style={styles.avatarCol}>
          {/* Gradient ring */}
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.violet, CultureTokens.coral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradientRing}
          >
            <View style={[styles.avatarRingGap, { backgroundColor: panelBg }]}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  accessibilityLabel={`${name} profile photo`}
                />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: withAlpha(accentColor, 0.15) }]} accessibilityLabel={`Initials ${initials}`}>
                  <Text style={[styles.avatarInitials, { color: accentColor }]}>{initials}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
          {/* Tier pill with status dot */}
          <View style={[styles.tierPillRow]}>
            <PulsingActiveDot color={CultureTokens.emerald} />
            <View style={[styles.tierPill, { backgroundColor: withAlpha(tierColor, 0.14), borderColor: withAlpha(tierColor, 0.35) }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={[styles.name, { color: textColor }]} accessibilityRole="header">{name}</Text>
          <Text style={[styles.handle, { color: mutedColor }]}>@{username}</Text>
          <Pressable
            onPress={onCopyCpid}
            style={[styles.cpidRow, { borderColor: withAlpha(accentColor, 0.28), backgroundColor: withAlpha(accentColor, 0.08) }]}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'CulturePass ID copied' : `Copy CulturePass ID ${cpid}`}
          >
            <Ionicons name="finger-print" size={16} color={accentColor} />
            <Text style={[styles.cpid, { color: accentColor }]}>{cpid}</Text>
            <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={14} color={accentColor} />
          </Pressable>
          <Text style={[styles.since, { color: mutedColor }]}>Member since {memberSince}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {quickActions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: withAlpha(action.color, 0.2), backgroundColor: withAlpha(action.color, 0.07), opacity: pressed ? 0.78 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={[styles.actionIcon, { backgroundColor: withAlpha(action.color, 0.16) }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <Text style={[styles.actionLabel, { color: mutedColor }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  content: { padding: 16, gap: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatarCol: { alignItems: 'center', gap: 8 },
  avatarGradientRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingGap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 24, fontFamily: FontFamily.bold },
  tierPillRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.6, textTransform: 'uppercase' },
  meta: { flex: 1, gap: 4 },
  name: { fontSize: 22, fontFamily: FontFamily.bold, lineHeight: 26 },
  handle: { fontSize: 14, fontFamily: FontFamily.medium },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } } as object),
  },
  cpid: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  since: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 10, fontFamily: FontFamily.semibold, textAlign: 'center' },
});