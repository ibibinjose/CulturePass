/**
 * Tab header chrome: home logo + page title + global actions (search, notifications, account menu).
 * One pattern for Discover, Feed, Events, Community, Perks, and Profile (in-tab).
 */
import React, { useCallback, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { coreApi } from '@/modules/core/api';
import { CultureTokens, FontFamily, FontSize, LineHeight, HeaderTokens } from '@/design-system/tokens/theme';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';

export const BRAND_TAGLINE_SHORT = 'Discover. Connect. Belong.';

const isWeb = Platform.OS === 'web';

function haptic() {
  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Logo only — tap returns to Discover home. */
export function HomeLogoMark({ compact = true }: { compact?: boolean }) {
  const colors = useColors();
  const onHome = useCallback(() => {
    haptic();
    router.push('/(tabs)' as const);
  }, []);

  const ringSize = compact ? 38 : 44;
  const radius = compact ? 11 : 13;
  const RING = 2.5;
  const innerSize = ringSize - RING * 2;
  const innerRadius = Math.max(radius - RING, 0);

  return (
    <Pressable
      onPress={onHome}
      accessibilityRole="button"
      accessibilityLabel="CulturePass home, Discover"
      accessibilityHint="Navigates to the Discover tab"
      style={markStyles.logoPress}
      hitSlop={10}
    >
      <View style={{ width: ringSize, height: ringSize, borderRadius: radius, overflow: 'hidden', flexShrink: 0 }}>
        <LinearGradient
          colors={[CultureTokens.violet, CultureTokens.coral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{
            position: 'absolute',
            top: RING,
            left: RING,
            width: innerSize,
            height: innerSize,
            borderRadius: innerRadius,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: innerSize - 4, height: innerSize - 4 }}
            contentFit="contain"
          />
        </View>
      </View>
    </Pressable>
  );
}

/** Legacy: full wordmark + optional tagline (web-only marketing surfaces). */
export function BrandMark({
  compact = false,
  showTagline = true,
}: {
  compact?: boolean;
  showTagline?: boolean;
}) {
  const colors = useColors();

  const onHome = useCallback(() => {
    haptic();
    router.push('/(tabs)' as const);
  }, []);

  return (
    <Pressable
      style={[markStyles.press, compact && markStyles.pressCompact]}
      onPress={onHome}
      accessibilityRole="button"
      accessibilityLabel="CulturePass home"
    >
      {(() => {
        const ringSize = compact ? 38 : 44;
        const radius = compact ? 11 : 13;
        const RING = 2.5;
        const innerSize = ringSize - RING * 2;
        const innerRadius = Math.max(radius - RING, 0);
        return (
          <View style={{ width: ringSize, height: ringSize, borderRadius: radius, overflow: 'hidden', flexShrink: 0 }}>
            <LinearGradient
              colors={[CultureTokens.violet, CultureTokens.coral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={{
                position: 'absolute',
                top: RING,
                left: RING,
                width: innerSize,
                height: innerSize,
                borderRadius: innerRadius,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={{ width: innerSize - 4, height: innerSize - 4 }}
                contentFit="contain"
              />
            </View>
          </View>
        );
      })()}

      <View style={markStyles.textWrap}>
        <Text
          style={[markStyles.name, compact && markStyles.nameCompact, { color: colors.text }]}
          numberOfLines={1}
        >
          CulturePass
        </Text>
        {showTagline && !compact ? (
          <Text style={[markStyles.tagline, { color: CultureTokens.gold }]} numberOfLines={1}>
            {BRAND_TAGLINE_SHORT}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function GlobalNavActions({
  showMenu = true,
  leadingAction,
}: {
  showMenu?: boolean;
  leadingAction?: ReactNode;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const { userId } = useAuth();

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: async () => {
      const res = await coreApi.notifications.unreadCount();
      return res.count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const glassStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
  };

  const rippleColor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={markStyles.actions}>
      {leadingAction ?? null}

      {/* Notification bell */}
      <Pressable
        style={({ pressed }) => [
          markStyles.iconBtn,
          glassStyle,
          Platform.OS !== 'android' && pressed && { opacity: 0.68 },
        ]}
        onPress={() => { haptic(); router.push('/notifications' as const); }}
        accessibilityRole="button"
        accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        android_ripple={Platform.OS === 'android' ? { color: rippleColor, borderless: false, radius: 22 } : undefined}
      >
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={MAIN_TAB_UI.iconSize.md}
          color={unreadCount > 0 ? CultureTokens.violet : colors.text}
        />
        {unreadCount > 0 && (
          <View style={[markStyles.badge, { borderColor: colors.surface }]}>
            <Text style={markStyles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        )}
      </Pressable>

      {/* Search */}
      <Pressable
        style={({ pressed }) => [
          markStyles.iconBtn,
          glassStyle,
          Platform.OS !== 'android' && pressed && { opacity: 0.68 },
        ]}
        onPress={() => { haptic(); router.push('/search' as const); }}
        accessibilityRole="button"
        accessibilityLabel="Search"
        accessibilityHint="Open search"
        android_ripple={Platform.OS === 'android' ? { color: rippleColor, borderless: false, radius: 22 } : undefined}
      >
        <Ionicons name="search" size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
      </Pressable>

      {showMenu ? (
        <Pressable
          style={({ pressed }) => [
            markStyles.iconBtn,
            glassStyle,
            Platform.OS !== 'android' && pressed && { opacity: 0.68 },
          ]}
          onPress={() => { haptic(); router.push('/menu' as const); }}
          accessibilityRole="button"
          accessibilityLabel="Account and profile menu"
          accessibilityHint="Open app menu"
          android_ripple={Platform.OS === 'android' ? { color: rippleColor, borderless: false, radius: 22 } : undefined}
        >
          <Ionicons name="menu" size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Page-first header: logo | title | search · notifications · account menu */
export function TabPageChromeRow({
  title,
  subtitle,
  locationLabel,
  showMenu = true,
  showHairline = false,
  topHeaderAction,
}: {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  showMenu?: boolean;
  showHairline?: boolean;
  topHeaderAction?: ReactNode;
}) {
  const colors = useColors();

  return (
    <View
      style={[
        markStyles.pageChromeRow,
        !showHairline && markStyles.chromeRowPlain,
        showHairline && { borderBottomColor: colors.borderLight },
      ]}
    >
      <HomeLogoMark compact />
      <View style={markStyles.pageTitleCol}>
        <Text
          style={[markStyles.pageTitle, { color: colors.text }]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[markStyles.pageSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {locationLabel ? (
          <View style={markStyles.locationInline}>
            <Ionicons name="location-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.indigo} />
            <Text style={[markStyles.pageLocation, { color: colors.textTertiary }]} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <GlobalNavActions showMenu={showMenu} leadingAction={topHeaderAction} />
    </View>
  );
}

const markStyles = StyleSheet.create({
  logoPress: {
    flexShrink: 0,
  },
  pageChromeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitleCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingTop: 0,
  },
  pageTitle: {
    fontSize: HeaderTokens.titleFontSize,
    lineHeight: HeaderTokens.titleFontSize + 4,
    fontFamily: HeaderTokens.titleFontFamily,
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    marginTop: 2,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    fontFamily: FontFamily.medium,
  },
  locationInline: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageLocation: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_400Regular',
  },
  chromeRowPlain: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  press: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressCompact: {
    gap: 8,
  },
  logoRingOuter: {
    width: 44,
    height: 44,
    borderRadius: 14,
    flexShrink: 0,
  },
  logoRingOuterCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  logoRingGradient: {
    flex: 1,
    borderRadius: 14,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingGradientCompact: {
    borderRadius: 12,
    padding: 2,
  },
  logoRingInner: {
    flex: 1,
    width: '100%',
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingInnerCompact: {
    borderRadius: 10,
  },
  logo: {
    width: 39,
    height: 39,
  },
  logoCompact: {
    width: 34,
    height: 34,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  name: {
    fontSize: FontSize.title2,
    lineHeight: LineHeight.title2,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.45,
  },
  nameCompact: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.35,
  },
  tagline: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.35,
    opacity: 0.92,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingTop: 0,
  },
  iconBtn: {
    width: MAIN_TAB_UI.minTouchTarget,
    height: MAIN_TAB_UI.minTouchTarget,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: CultureTokens.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 11,
  },
});
