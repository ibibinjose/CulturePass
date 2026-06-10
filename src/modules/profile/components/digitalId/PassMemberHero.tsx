import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

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
            <View style={styles.avatarFallback} accessibilityLabel={`Initials ${initials}`}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={[styles.tierPill, { backgroundColor: withAlpha(tierColor, 0.14), borderColor: withAlpha(tierColor, 0.35) }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
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
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={accentColor} />
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
              { borderColor: panelBorder, backgroundColor: withAlpha(action.color, 0.06), opacity: pressed ? 0.82 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={[styles.actionIcon, { backgroundColor: withAlpha(action.color, 0.14) }]}>
              <Ionicons name={action.icon} size={18} color={action.color} />
            </View>
            <Text style={[styles.actionLabel, { color: mutedColor }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  content: { padding: 16, gap: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatarCol: { alignItems: 'center', gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 18, borderWidth: 2, borderColor: WALLET_PASS_THEME.whiteHex },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: WALLET_PASS_THEME.whiteHex,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: WALLET_PASS_THEME.borderOnWhite,
  },
  avatarInitials: { fontSize: 24, fontFamily: FontFamily.bold, color: '#4F46E5' },
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
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 10, fontFamily: FontFamily.semibold, textAlign: 'center' },
});