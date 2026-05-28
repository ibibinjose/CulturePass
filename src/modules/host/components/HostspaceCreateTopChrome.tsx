import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

export function HostspaceCreateTopChrome({
  liveListingCount,
  listingCountLoading,
}: {
  liveListingCount: number;
  listingCountLoading: boolean;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { hPad, isCompact } = useLayout();
  const topBarPadTop = Platform.OS === 'web' ? 10 : insets.top + 8;

  const iconGlass = {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  };

  return (
    <View style={[styles.topChrome, { paddingTop: topBarPadTop, paddingHorizontal: hPad }]}>
      <GlassView
        intensity={14}
        borderRadius={20}
        contentStyle={styles.topChromeInner}
        style={[
          styles.topChromeCard,
          {
            borderColor: colors.borderLight,
            backgroundColor: colors.surface + (Platform.OS === 'web' ? 'CC' : 'F2'),
          },
        ]}
      >
        <Pressable
          onPress={() => {
            haptic();
            router.push('/hostspace' as never);
          }}
          style={({ pressed }) => [iconGlass, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Back to Culture Business Hub"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.topChromeTitles}>
          {!isCompact ? (
            <Text style={[styles.topChromeEyebrow, { color: CultureTokens.indigo }]} numberOfLines={1}>
              Culture Business Hub
            </Text>
          ) : null}
          <Text style={[styles.topChromeTitle, { color: colors.text }]} numberOfLines={1}>
            Listing studio
          </Text>
        </View>

        <View style={styles.topChromeTrailing}>
          <View
            style={[
              styles.listingCountPill,
              {
                backgroundColor: CultureTokens.indigo + '14',
                borderColor: CultureTokens.indigo + '35',
              },
            ]}
            accessibilityLabel={
              listingCountLoading
                ? 'Loading listing count'
                : `${liveListingCount} live listings across directory and CultureMarket`
            }
          >
            <Ionicons name="layers-outline" size={14} color={CultureTokens.indigo} />
            <Text style={[styles.listingCountText, { color: colors.text }]}>
              {listingCountLoading ? '…' : `${liveListingCount}`}
            </Text>
            {!isCompact ? (
              <Text style={[styles.listingCountLabel, { color: colors.textSecondary }]}>live</Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              haptic();
              router.push('/hostspace' as never);
            }}
            style={({ pressed }) => [iconGlass, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Open host hub"
          >
            <Ionicons name="home-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              haptic();
              router.push('/hostspace/dashboard' as never);
            }}
            style={({ pressed }) => [iconGlass, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Open host dashboard"
          >
            <Ionicons name="grid-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              haptic();
              // In a real app, this might open a help modal or the HelpPanel
              Alert.alert('Help & Support', 'Need help with Listing Studio? Our guide is coming soon. For now, contact hello@culturepass.app');
            }}
            style={({ pressed }) => [iconGlass, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Open help"
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  topChrome: {
    zIndex: 2,
  },
  topChromeCard: {
    overflow: 'hidden',
  },
  topChromeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: 14,
  },
  topChromeTitles: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: 'center',
  },
  topChromeEyebrow: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  topChromeTitle: {
    ...TextStyles.title3,
    fontSize: Platform.OS === 'web' ? 18 : 17,
  },
  topChromeTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  listingCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  listingCountText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  listingCountLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
});
