import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import {
  CultureTokens,
  FontFamily,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { Radius, Spacing } from '@/design-system/tokens/spacing';

const HOST_PERKS = [
  {
    icon: 'calendar-outline' as const,
    color: CultureTokens.teal,
    title: 'Create events',
    desc: 'Publish ticketed or free cultural events to thousands of diaspora members.',
  },
  {
    icon: 'storefront-outline' as const,
    color: CultureTokens.coral,
    title: 'List on CultureMarket',
    desc: 'Sell products, offer services, or link your cultural business website.',
  },
  {
    icon: 'people-outline' as const,
    color: CultureTokens.violet,
    title: 'Build communities',
    desc: 'Create and grow diaspora groups, cultural associations, and member circles.',
  },
  {
    icon: 'grid-outline' as const,
    color: CultureTokens.gold,
    title: 'Access dashboards',
    desc: 'Track ticket sales, attendee data, revenue, and community engagement.',
  },
];

export type HostspaceGateIntent = 'hub' | 'creationLab';

function HostspaceGateScreen({ intent = 'hub' }: { intent?: HostspaceGateIntent }) {
  const colors = useColors();
  const { hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { isAuthenticated } = useAuth();

  const badgeLabel =
    intent === 'creationLab' ? 'Host sign-in required' : 'Host account required';
  const title =
    intent === 'creationLab'
      ? 'Creation Lab is for\napproved hosts'
      : `Join as a${'\n'}Cultural Host`;
  const body =
    intent === 'creationLab'
      ? 'Listing studio, CultureMarket, and directory profiles are available once your account has host access (organizer role). Most apps are reviewed within 24h. Some profiles (venues, ABN businesses, professionals) require a quick extra verification step after you create them.'
      : 'CulturePass hosts create events, list products and services, build communities, and reach thousands of diaspora members across Australia and New Zealand. Applications are usually approved within 24 hours.';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={{ paddingHorizontal: hPad, paddingTop: topInset + Spacing.lg, paddingBottom: 64 }}>
          {/* Enhanced Premium Background */}
          <LinearGradient
            colors={[CultureTokens.indigo + '33', CultureTokens.violet + '22', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background, opacity: 0.4 }]} pointerEvents="none" />

          <Animated.View
            entering={FadeInDown.delay(40).springify()}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Pressable
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)
              }
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.surfaceElevated }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: 15, color: colors.text }}>HostSpace</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: CultureTokens.gold + '22',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                alignSelf: 'flex-start',
                marginBottom: 18,
              }}
            >
              <Ionicons name="lock-closed" size={14} color={CultureTokens.gold} />
              <Text
                style={{
                  fontFamily: FontFamily.semibold,
                  fontSize: 12,
                  color: CultureTokens.gold,
                  letterSpacing: 0.3,
                }}
              >
                {badgeLabel}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FontFamily.bold,
                fontSize: Platform.OS === 'web' ? 46 : 34,
                letterSpacing: -0.8,
                lineHeight: Platform.OS === 'web' ? 52 : 40,
                color: colors.text,
                marginBottom: 16,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: FontFamily.regular,
                fontSize: 16,
                lineHeight: 24,
                color: colors.textSecondary,
                maxWidth: 520,
                marginBottom: 32,
              }}
            >
              {body}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Pressable
                onPress={() => router.push('/hostspace/apply' as never)}
                style={({ pressed }) => ({
                  height: 50,
                  borderRadius: 999,
                  paddingHorizontal: 28,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  overflow: 'hidden',
                  minWidth: 200,
                  opacity: pressed ? 0.9 : 1,
                })}
                accessibilityRole="button"
                accessibilityLabel="Apply to become a host"
              >
                <LinearGradient
                  colors={SignatureGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="rocket-outline" size={18} color="#fff" />
                <Text style={{ fontFamily: FontFamily.semibold, fontSize: 15, color: '#fff' }}>
                  Apply to become a host
                </Text>
              </Pressable>

              {!isAuthenticated && (
                <Pressable
                  onPress={() => router.push('/(onboarding)/login' as never)}
                  style={({ pressed }) => ({
                    height: 50,
                    borderRadius: 999,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.25)',
                    opacity: pressed ? 0.8 : 1,
                  })}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  <Text style={{ fontFamily: FontFamily.semibold, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>
                    Sign in
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>

        <View
          style={{
            paddingHorizontal: hPad,
            backgroundColor: colors.background,
            paddingTop: Spacing.xl,
            paddingBottom: Spacing.xl,
          }}
        >
          <Text
            style={{
              fontFamily: FontFamily.bold,
              fontSize: Platform.OS === 'web' ? 20 : 18,
              letterSpacing: -0.3,
              color: colors.text,
              marginBottom: Spacing.md,
            }}
          >
            What you can do as a host
          </Text>
          {HOST_PERKS.map((perk, i) => (
            <Animated.View key={perk.icon} entering={FadeInDown.delay(260 + i * 80).springify()}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: Spacing.md,
                  borderRadius: Radius.lg,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  backgroundColor: colors.surface,
                  marginBottom: 12,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: Radius.md,
                    backgroundColor: perk.color + '1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={perk.icon} size={22} color={perk.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FontFamily.bold,
                      fontSize: 15,
                      color: colors.text,
                      marginBottom: 3,
                    }}
                  >
                    {perk.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FontFamily.regular,
                      fontSize: 13,
                      lineHeight: 19,
                      color: colors.textSecondary,
                    }}
                  >
                    {perk.desc}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: Spacing.md }}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
            <Text
              style={{
                fontFamily: FontFamily.regular,
                fontSize: 12,
                lineHeight: 18,
                color: colors.textTertiary,
                flex: 1,
              }}
            >
              Host accounts are reviewed by the CulturePass team. Most applications are approved within 24 hours.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export interface HostspaceAccessGateProps {
  children: React.ReactNode;
  /** Tailors gate copy when user opens Creation Lab routes directly. */
  intent?: HostspaceGateIntent;
}

/**
 * Host-space routes must require **signed-in + organizer (or higher)** role.
 * `/hostspace` used this gate; `/hostspace/create` previously did not — fixed here.
 */
export function HostspaceAccessGate({ children, intent = 'hub' }: HostspaceAccessGateProps) {
  const { isAuthenticated, isLoading, isRestoring } = useAuth();
  const { isOrganizer, isLoading: roleLoading } = useRole();
  const colors = useColors();

  if (isLoading || isRestoring || roleLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CultureTokens.indigo} accessibilityLabel="Loading" />
      </View>
    );
  }

  if (!isAuthenticated || !isOrganizer) {
    return <HostspaceGateScreen intent={intent} />;
  }

  return <>{children}</>;
}
