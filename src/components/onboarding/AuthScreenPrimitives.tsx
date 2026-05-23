/**
 * Shared Liquid Glass chrome for onboarding auth screens (login, signup, reset).
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Spacing,
  IconSize,
  FontFamily,
  FontSize,
  CultureTokens,
  ScreenTokens,
  shadows,
} from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { GlassView } from '@/design-system/ui/GlassView';

export function AuthAmbientBackground() {
  const colors = useColors();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${CultureTokens.indigo}22`, `${CultureTokens.indigo}08`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambientOrbTop}
      />
      <LinearGradient
        colors={[`${CultureTokens.indigo}12`, 'transparent', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.ambientOrbBottom}
      />
    </View>
  );
}

type AuthLiquidFormCardProps = {
  children: React.ReactNode;
  isDesktop: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AuthLiquidFormCard({ children, isDesktop, style, contentStyle }: AuthLiquidFormCardProps) {
  return (
    <GlassView
      style={[
        styles.formCard,
        isDesktop && styles.formCardDesktop,
        Platform.select({
          ios: shadows.large,
          android: { elevation: 8 },
          web: shadows.heavy,
        }),
        style,
      ]}
      contentStyle={[styles.formCardInner, contentStyle]}
    >
      {children}
    </GlassView>
  );
}

type DesktopBackPillProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function AuthDesktopBackPill({ label, onPress, accessibilityLabel }: DesktopBackPillProps) {
  const colors = useColors();
  return (
    <View style={styles.desktopBackRow}>
      <Pressable
        onPress={onPress}
        hitSlop={Spacing.sm}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={[
          styles.desktopPillInner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderRadius: Spacing.lg,
          },
        ]}
      >
        <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.text} />
        <Text style={[styles.desktopBackText, { color: colors.text }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

// 'close-with-brand' kept for backward compat but now renders like 'close-only' —
// brand lives inside the form card to prevent double-brand on mobile.
type MobileHeaderVariant = 'close-with-brand' | 'close-only' | 'back-only';

type AuthMobileHeaderProps = {
  variant: MobileHeaderVariant;
  onPress: () => void;
};

export function AuthMobileHeader({ variant, onPress }: AuthMobileHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const padTop = topInset + ScreenTokens.topOffset;

  const isBack = variant === 'back-only';

  return (
    <View style={[styles.mobileHeaderSingle, { paddingTop: padTop }]}>
      <Pressable
        onPress={onPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isBack ? 'Go back' : 'Close'}
        style={[
          styles.navBtn,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <Ionicons
          name={isBack ? 'chevron-back' : 'close'}
          size={20}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  formCardDesktop: { maxWidth: 540 },
  formCardInner: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  ambientOrbTop: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 999,
  },
  ambientOrbBottom: {
    position: 'absolute',
    bottom: -110,
    left: -70,
    width: 280,
    height: 280,
    borderRadius: 999,
  },
  desktopBackRow: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.xxl,
    zIndex: 10,
  },
  desktopPillInner: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  desktopBackText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  mobileHeaderSingle: {
    paddingHorizontal: 20,
    paddingBottom: Spacing.xs,
    alignItems: 'flex-start',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
