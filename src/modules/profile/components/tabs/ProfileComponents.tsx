import React from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { BorderTokens, CultureTokens, FontFamily, FontSize, Spacing, Radius } from '@/design-system/tokens/theme';
import { DEEP_SAFFRON } from '@/design-system/tokens/luxeHeritage';
import { CultureWalletMap } from '@/modules/profile/components/private/CultureWalletMap';
import { GlassView } from '@/design-system/ui/GlassView';
import { TruncatedText } from '@/design-system/ui';
import type { User } from '@shared/schema';
import { initials } from './ProfileUtils';

// ── Section header ────────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action, onAction, colors }: {
  title: string; subtitle?: string; action?: string; onAction?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={sh.wrap}>
      <View style={sh.row}>
        <View style={sh.textBlock}>
          <View style={sh.titleRow}>
            <View style={[sh.accentDot, { backgroundColor: colors.primary }]} />
            <TruncatedText style={[sh.title, { color: colors.text }]} lines={1}>{title}</TruncatedText>
          </View>
          {subtitle ? (
            <TruncatedText style={[sh.sub, { color: colors.textSecondary }]} lines={2}>
              {subtitle}
            </TruncatedText>
          ) : null}
        </View>

        {action && onAction && (
          <Pressable
            onPress={onAction}
            hitSlop={12}
            accessibilityRole="button"
            style={({ pressed }) => [
              sh.seeAllBtn,
              pressed && sh.pressed,
            ]}
          >
            <Text style={[sh.seeAllText, { color: colors.primary }]} numberOfLines={1}>{action}</Text>
            <View style={[sh.seeAllIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="chevron-forward" size={12} color={colors.primary} />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  wrap: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },
  textBlock: { flex: 1, gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  accentDot: { width: 6, height: 6, borderRadius: 3 },
  title: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  sub: { fontSize: 13, fontFamily: FontFamily.regular, opacity: 0.7, paddingLeft: 16 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, flexShrink: 0 },
  seeAllText: { fontSize: 13, fontFamily: FontFamily.semibold },
  seeAllIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});

export function RecoRow({
  icon,
  title,
  subtitle,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={({ pressed }) => [
        rr.recoRow,
        { borderColor: colors.borderLight },
        pressed && rr.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[rr.recoIconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={rr.recoBody}>
        <TruncatedText style={[rr.recoTitle, { color: colors.text }]} lines={1}>{title}</TruncatedText>
        <TruncatedText style={[rr.recoSubtitle, { color: colors.textSecondary }]} lines={2}>
          {subtitle}
        </TruncatedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const rr = StyleSheet.create({
  recoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  recoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoBody: { flex: 1, minWidth: 0 },
  recoTitle: { fontSize: FontSize.callout, fontFamily: FontFamily.semibold },
  recoSubtitle: { fontSize: FontSize.caption, marginTop: 2 },
  pressed: { opacity: 0.8 },
});

// ── Avatar ────────────────────────────────────────────────────────────────────

export function ProfileAvatar({ user, displayName, size = 100 }: {
  user: Partial<User>; displayName: string; size?: number;
}) {
  const colors = useColors();
  const hasPhoto = !!user.avatarUrl;
  const isElite = (user.membership?.tier && user.membership.tier !== 'free') || user.isVerified;
  const ringSize = size + 8;
  const midSize = size + 4;

  return (
    <View style={av.relativeWrap}>
      <LinearGradient
        colors={isElite ? [CultureTokens.gold, DEEP_SAFFRON] : [CultureTokens.teal, CultureTokens.indigo]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[av.gradientRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
      >
        <View style={[av.midRing, { width: midSize, height: midSize, borderRadius: midSize / 2, backgroundColor: colors.background }]}>
            <View style={[av.photoWrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.backgroundSecondary }]}>
            {hasPhoto
                ? <Image source={{ uri: user.avatarUrl! }} style={[av.photo, { width: size, height: size }]} contentFit="cover" transition={300} />
                : <View style={av.initialsWrap}>
                    <Text style={[av.initialsText, { fontSize: size * 0.35, color: colors.primary }]} numberOfLines={1}>
                    {initials(displayName)}
                    </Text>
                </View>}
            </View>
        </View>
      </LinearGradient>

      {user.isVerified && (
        <View style={[av.verifiedBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Ionicons name="shield-checkmark" size={size * 0.12} color={BorderTokens.white} />
        </View>
      )}
    </View>
  );
}
const av = StyleSheet.create({
  relativeWrap: { position: 'relative', marginBottom: 16 },
  gradientRing: { padding: 2, alignItems: 'center', justifyContent: 'center' },
  midRing: { padding: 2, alignItems: 'center', justifyContent: 'center' },
  photoWrap: { overflow: 'hidden' },
  photo: {},
  initialsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontFamily: FontFamily.bold, letterSpacing: 1 },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

// ── Loading skeleton ──────────────────────────────────────────────────────────

export function ProfileSkeleton({ colors, topInset = 0 }: { colors: ReturnType<typeof useColors>; topInset?: number }) {
  return (
    <View style={[sk.screen, { backgroundColor: colors.background }]}>
      <View style={[sk.hero, { paddingTop: topInset + 48 }]}>
        <View style={[sk.avatarRing, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
        <View style={[sk.nameLine, { backgroundColor: colors.borderLight, opacity: 0.3 }]} />
        <View style={[sk.handleLine, { backgroundColor: colors.borderLight, opacity: 0.2 }]} />
      </View>
      <View style={sk.skeletonPad}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[sk.block, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} />
        ))}
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  screen: { flex: 1 },
  hero: { alignItems: 'center', paddingBottom: 32, gap: 12 },
  avatarRing: { width: 108, height: 108, borderRadius: 54 },
  nameLine: { width: 160, height: 18, borderRadius: 9, marginTop: 4 },
  handleLine: { width: 100, height: 12, borderRadius: 6 },
  skeletonPad: { padding: 20, gap: 14 },
  block: { height: 120, borderRadius: 20, borderWidth: 1 },
});

// ── Culture Map Modal ─────────────────────────────────────────────────────────

export function CultureMapModal({ visible, onClose, cultures, colors }: {
  visible: boolean;
  onClose: () => void;
  cultures: { id: string; name: string; emoji: string; lat: number; lng: number; color: string }[];
  colors: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[cmap.overlay, cmap.overlayDim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GlassView
          intensity={30}
          style={[cmap.sheet, { backgroundColor: colors.background + 'F2', paddingTop: insets.top + 20 }]}
        >
          <View style={cmap.header}>
            <View>
              <Text style={[cmap.title, { color: colors.text }]} numberOfLines={1}>Cultural Heritage</Text>
              <TruncatedText style={[cmap.sub, { color: colors.textSecondary }]} lines={2}>
                {cultures.length === 1
                  ? `Rooted in ${cultures[0].name} heritage.`
                  : `Your CulturePass spans ${cultures.length} traditions`}
              </TruncatedText>
            </View>
            <Pressable
              style={[cmap.closeBtn, { backgroundColor: colors.primarySoft }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={cmap.chipsRow}>
            {cultures.map(c => (
              <GlassView key={c.id} intensity={10} style={[cmap.chip, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}>
                <Text style={cmap.chipEmoji} numberOfLines={1}>{c.emoji}</Text>
                <TruncatedText style={[cmap.chipLabel, { color: colors.text }]} lines={1}>{c.name}</TruncatedText>
              </GlassView>
            ))}
          </View>

          <View style={cmap.mapWrap}>
            <CultureWalletMap cultures={cultures} />
          </View>
        </GlassView>
      </View>
    </Modal>
  );
}

const cmap = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayDim: { backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', paddingBottom: Spacing.xxl, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 20 },
  title: { fontSize: FontSize.title, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  sub: { fontSize: FontSize.body2, fontFamily: FontFamily.regular },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  chipEmoji: { fontSize: 22 },
  chipLabel: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },
  mapWrap: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', marginHorizontal: Spacing.lg, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
});