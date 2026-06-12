import React, { type ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { DestinationStickyBar } from '@/components/city/DestinationStickyBar';
import { hostspaceShellSubtitle, type HostspaceShellMode } from '@/components/hostspace/hostspaceLayout';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { navigateToCreationLab } from '@/lib/creationRouting';

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

type IconBtnProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isDark: boolean;
  colors: ReturnType<typeof useColors>;
};

function IconBtn({ icon, label, onPress, isDark, colors }: IconBtnProps) {
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        s.iconBtn,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

export interface HostspaceStickyBarProps {
  mode: HostspaceShellMode;
  topInset: number;
  hPad: number;
  /** Overrides default subtitle from mode */
  subtitle?: string;
  categoryLabel?: string;
  compact?: boolean;
  liveListingCount?: number;
  listingCountLoading?: boolean;
  onBack?: () => void;
  children?: ReactNode;
}

/**
 * Unified HostSpace chrome — manage hub, creation lab, and wizard contexts.
 * Replaces the legacy "Culture Business Hub / Listing studio" top bar.
 */
export function HostspaceStickyBar({
  mode,
  topInset,
  hPad,
  subtitle,
  categoryLabel,
  compact = false,
  liveListingCount,
  listingCountLoading,
  onBack,
  children,
}: HostspaceStickyBarProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isCompact } = useLayout();
  const line = subtitle ?? hostspaceShellSubtitle(mode, categoryLabel);
  const topPad = Platform.OS === 'web' ? 10 : topInset + 8;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (mode === 'manage') {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)' as never);
      return;
    }
    if (mode === 'create' || mode === 'create-page') {
      router.replace('/hostspace' as never);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/hostspace' as never);
  };

  return (
    <DestinationStickyBar tone="legacy">
      <View style={[s.row, { paddingTop: topPad, paddingHorizontal: hPad, paddingBottom: children ? 8 : 12 }]}>
        <IconBtn icon="chevron-back" label="Back" onPress={handleBack} isDark={isDark} colors={colors} />

        <View style={s.titles}>
          <Text style={[s.brand, { color: CultureTokens.indigo }]} numberOfLines={1}>
            HostSpace
          </Text>
          {!isCompact || compact ? (
            <Text style={[s.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {line}
            </Text>
          ) : null}
        </View>

        <View style={s.trailing}>
          {!compact && liveListingCount !== undefined ? (
            <View
              style={[
                s.countPill,
                { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '35' },
              ]}
              accessibilityLabel={
                listingCountLoading
                  ? 'Loading listing count'
                  : `${liveListingCount} live listings`
              }
            >
              <Ionicons name="layers-outline" size={14} color={CultureTokens.indigo} />
              <Text style={[s.countText, { color: colors.text }]}>
                {listingCountLoading ? '…' : `${liveListingCount}`}
              </Text>
            </View>
          ) : null}

          {mode !== 'wizard' ? (
            <>
              <IconBtn
                icon="add-circle-outline"
                label="Open creation lab"
                onPress={() => navigateToCreationLab(`hostspace_sticky_${mode}`)}
                isDark={isDark}
                colors={colors}
              />
              <IconBtn
                icon="grid-outline"
                label="Open host dashboard"
                onPress={() => router.push('/hostspace/dashboard' as never)}
                isDark={isDark}
                colors={colors}
              />
            </>
          ) : null}

          {mode === 'manage' ? (
            <IconBtn
              icon="scan-outline"
              label="Open ticket scanner"
              onPress={() => router.push('/scanner' as never)}
              isDark={isDark}
              colors={colors}
            />
          ) : (
            <IconBtn
              icon="home-outline"
              label="Open host manage hub"
              onPress={() => router.push('/hostspace' as never)}
              isDark={isDark}
              colors={colors}
            />
          )}

          {!compact ? (
            <IconBtn
              icon="help-circle-outline"
              label="HostSpace help"
              onPress={() =>
                Alert.alert(
                  'HostSpace',
                  'Need help? Contact hello@culturepass.app — guides for creation, verification, and payouts are in progress.',
                )
              }
              isDark={isDark}
              colors={colors}
            />
          ) : null}
        </View>
      </View>
      {children}
    </DestinationStickyBar>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titles: {
    flex: 1,
    minWidth: 0,
    gap: 1,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  countText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
});