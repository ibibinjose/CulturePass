import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients, LiquidGlassTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Icon shown in the prompt (Ionicons name) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Main heading of the sign-in prompt */
  title?: string;
  /** Subtext explaining why sign-in is needed */
  message?: string;
  /** Show a back arrow so users can dismiss the prompt */
  showBack?: boolean;
}

/**
 * Wraps a screen that requires authentication.
 * Authenticated users see `children` as normal.
 * Guests see a glass + token-aligned sign-in prompt (matches Profile / tab chrome).
 */
export function AuthGuard({
  children,
  icon = 'lock-closed-outline',
  title = 'Sign in to continue',
  message = 'Create a free account to unlock this feature and discover cultural events near you.',
  showBack = true,
}: AuthGuardProps) {
  const { userId, isLoading } = useAuth();
  const pathname = usePathname();
  const colors = useColors();
  const { hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();

  if (isLoading) {
    return null;
  }

  if (userId) {
    return <>{children}</>;
  }

  const topPad = safeInsets.top;
  const botPad = safeInsets.bottom + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambientMesh}
        pointerEvents="none"
      />

      <GlassView
        borderRadius={0}
        bordered={false}
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
        contentStyle={{
          paddingTop: topPad + 12,
          paddingBottom: 12,
          paddingHorizontal: hPad,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {showBack ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.backChip, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={[styles.headerLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          Members only
        </Text>
      </GlassView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollInner,
          { paddingHorizontal: hPad, paddingBottom: botPad },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <GlassView
          borderRadius={LiquidGlassTokens.corner.mainCard}
          style={styles.card}
          contentStyle={styles.cardInner}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
            <LinearGradient
              colors={[CultureTokens.indigo + '28', CultureTokens.teal + '22']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name={icon} size={40} color={CultureTokens.indigo} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.featureList}>
            {[
              'Tickets & QR check-in',
              'Saved events & communities',
              'Wallet & CulturePass ID',
            ].map((f) => (
              <GlassView
                key={f}
                borderRadius={LiquidGlassTokens.corner.innerRow + 4}
                contentStyle={styles.featureRowInner}
              >
                <Ionicons name="checkmark-circle" size={18} color={CultureTokens.teal} />
                <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
              </GlassView>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push({ pathname: '/(onboarding)/signup', params: { redirectTo: pathname } } as never)}
            accessibilityRole="button"
            accessibilityLabel="Create free account"
          >
            <Text style={[styles.primaryBtnText, { color: colors.textOnBrandGradient }]}>Create free account</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textOnBrandGradient} />
          </Pressable>

          <GlassView borderRadius={14} contentStyle={{ padding: 0 }}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtnInner, { opacity: pressed ? 0.88 : 1 }]}
              onPress={() => router.push({ pathname: '/(onboarding)/login', params: { redirectTo: pathname } } as never)}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={[styles.secondaryBtnText, { color: CultureTokens.indigo }]}>I already have an account</Text>
            </Pressable>
          </GlassView>

          <Pressable
            style={styles.browseBtn}
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Back to discovery"
          >
            <Text style={[styles.browseBtnText, { color: colors.textTertiary }]}>Back to Discovery</Text>
          </Pressable>
        </GlassView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientMesh: {
    ...StyleSheet.absoluteFill,
    opacity: 0.06,
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  headerLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.2,
  },
  scrollInner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  cardInner: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  featureList: {
    gap: 10,
    marginBottom: 28,
    width: '100%',
  },
  featureRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    lineHeight: 20,
  },
  primaryBtn: {
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  secondaryBtnInner: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  browseBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  browseBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
});
