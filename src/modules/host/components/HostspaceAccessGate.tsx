import React from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import {
  CultureTokens,
  FontFamily,
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
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const { isAuthenticated, refreshSession } = useAuth();
  const { isOrganizer } = useRole();
  const { isDesktop } = useLayout();

  // Query application status when authenticated
  const { data: appData, isLoading: appLoading, refetch: refetchApp } = useQuery({
    queryKey: ['my-host-application-gate'],
    queryFn: () => api.hostApplications.myApplication(),
    enabled: isAuthenticated && !isOrganizer,
    staleTime: 15_000,
  });

  const app = appData?.application;
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchApp();
      await refreshSession();
    } catch (e) {
      console.warn(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh when approved
  React.useEffect(() => {
    if (app?.status === 'approved' && !isOrganizer) {
      refreshSession().catch((err) => {
        console.warn('Auto refresh failed in HostspaceAccessGate:', err);
      });
    }
  }, [app?.status, isOrganizer, refreshSession]);

  if (isAuthenticated && (appLoading || isRefreshing)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CultureTokens.indigo} />
        <Text style={{ marginTop: 16, color: colors.textSecondary, fontFamily: FontFamily.medium, fontSize: 14 }}>
          Checking host account status...
        </Text>
      </View>
    );
  }

  // Active Approved (refreshing token)
  if (app?.status === 'approved' && !isOrganizer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CultureTokens.indigo} />
        <Text style={{ marginTop: 16, color: colors.text, fontFamily: FontFamily.bold, fontSize: 16 }}>
          Activating Host Workspace...
        </Text>
        <Text style={{ marginTop: 8, color: colors.textSecondary, fontFamily: FontFamily.regular, fontSize: 14 }}>
          Setting up your creator privileges.
        </Text>
      </View>
    );
  }

  // Pending Review View
  if (app?.status === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: hPad, paddingTop: topInset + Spacing.lg, paddingBottom: safeInsets.bottom + 40 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.surfaceElevated }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: 14, color: colors.text }}>Application Status</Text>
            <View style={{ width: 36 }} />
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }}>
            <View style={[styles.statusCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <View style={[styles.statusIconWrap, { backgroundColor: CultureTokens.gold + '1A' }]}>
                <Ionicons name="time" size={48} color={CultureTokens.gold} />
              </View>

              <Text style={[styles.statusTitle, { color: colors.text }]}>Application Under Review</Text>
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                Our team is currently reviewing your host profile request. We typically activate hosts within 24 hours. We&apos;ll send you an email once your account is ready.
              </Text>

              <View style={styles.timeline}>
                {[
                  { icon: 'checkmark-circle' as const, color: CultureTokens.teal, label: 'Request received', done: true },
                  { icon: 'search' as const, color: CultureTokens.gold, label: 'Team review (in progress)', done: false, active: true },
                  { icon: 'rocket-outline' as const, color: colors.textTertiary, label: 'Host account activated', done: false },
                ].map((t, i) => (
                  <View key={t.label} style={styles.timelineRow}>
                    <View style={[
                      styles.timelineDot,
                      {
                        backgroundColor: t.done ? t.color : t.active ? 'transparent' : 'rgba(255,255,255,0.05)',
                        borderColor: t.done || t.active ? t.color : 'rgba(255,255,255,0.12)',
                        borderWidth: t.active ? 2 : 1
                      }
                    ]}>
                      <Ionicons name={t.icon} size={16} color={t.done ? '#fff' : t.color} />
                    </View>
                    {i < 2 && <View style={[styles.timelineLine, { backgroundColor: colors.borderLight }]} />}
                    <Text style={[
                      styles.timelineLabel,
                      { color: t.done ? '#fff' : t.active ? CultureTokens.gold : colors.textTertiary }
                    ]}>
                      {t.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ gap: 12, width: '100%', marginTop: 8 }}>
                <Pressable
                  onPress={handleRefresh}
                  style={({ pressed }) => [
                    styles.primaryCta,
                    { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <Ionicons name="refresh-outline" size={16} color="#fff" />
                  <Text style={styles.primaryCtaText}>Check Status</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.replace('/(tabs)' as never)}
                  style={({ pressed }) => [
                    styles.secondaryCta,
                    { borderColor: colors.border, opacity: pressed ? 0.85 : 1 }
                  ]}
                >
                  <Text style={[styles.secondaryCtaText, { color: colors.text }]}>Back to Discover</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Rejected View
  if (app?.status === 'rejected') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: hPad, paddingTop: topInset + Spacing.lg, paddingBottom: safeInsets.bottom + 40 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.surfaceElevated }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: 14, color: colors.text }}>Application Status</Text>
            <View style={{ width: 36 }} />
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }}>
            <View style={[styles.statusCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <View style={[styles.statusIconWrap, { backgroundColor: CultureTokens.coral + '1A' }]}>
                <Ionicons name="close-circle" size={48} color={CultureTokens.coral} />
              </View>

              <Text style={[styles.statusTitle, { color: colors.text }]}>Application Not Approved</Text>
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                {app.reviewNote 
                  ? `Feedback from our team: "${app.reviewNote}"`
                  : 'Your application was not approved at this time. You can update your details and re-apply.'}
              </Text>

              <View style={{ gap: 12, width: '100%', marginTop: 24 }}>
                <Pressable
                  onPress={() => router.push('/pages/create' as never)}
                  style={({ pressed }) => [
                    styles.primaryCta,
                    { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.primaryCtaText}>Update Application</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.replace('/(tabs)' as never)}
                  style={({ pressed }) => [
                    styles.secondaryCta,
                    { borderColor: colors.border, opacity: pressed ? 0.85 : 1 }
                  ]}
                >
                  <Text style={[styles.secondaryCtaText, { color: colors.text }]}>Back to Discover</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Fallback to normal gate promo screen
  const badgeLabel =
    intent === 'creationLab' ? 'Host sign-in required' : 'Host account required';
  const title =
    intent === 'creationLab'
      ? 'Creation Lab is for approved hosts'
      : `Join as a Cultural Host`;
  const body =
    intent === 'creationLab'
      ? 'Listing studio, CultureMarket, and directory profiles are available once your account has host access (organizer role). Most apps are reviewed within 24h.'
      : 'CulturePass hosts create events, list products and services, build communities, and reach thousands of diaspora members. Applications are usually approved within 24 hours.';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: safeInsets.bottom + 40 }}
      >
        {/* Compact top section with reduced height */}
        <View 
          style={{ 
            paddingHorizontal: hPad, 
            paddingTop: topInset + (isDesktop ? Spacing.sm : Spacing.md), 
            paddingBottom: isDesktop ? Spacing.md : 32 
          }}
        >
          <LinearGradient
            colors={[CultureTokens.indigo + '22', CultureTokens.violet + '15', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Compact nav */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.surfaceElevated }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: 14, color: colors.text }}>HostSpace</Text>
            <View style={{ width: 36 }} />
          </View>

          {isDesktop ? (
            // Desktop side-by-side
            <View style={{ flexDirection: 'row', gap: 40, alignItems: 'flex-start' }}>
              {/* Left column: Info + CTAs (reduced height) */}
              <View style={{ flex: 1, maxWidth: 480 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CultureTokens.gold + '22', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 }}>
                  <Ionicons name="lock-closed" size={12} color={CultureTokens.gold} />
                  <Text style={{ fontFamily: FontFamily.semibold, fontSize: 11, color: CultureTokens.gold }}>{badgeLabel}</Text>
                </View>

                <Text style={{ fontFamily: FontFamily.bold, fontSize: 30, letterSpacing: -0.5, color: colors.text, marginBottom: 10, lineHeight: 36 }}>
                  {title}
                </Text>

                <Text style={{ fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 20 }}>
                  {body}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(onboarding)/signup', params: { role: 'organizer', redirectTo: '/pages/create', intent: 'host' } } as never)}
                    style={({ pressed }) => ({ height: 44, borderRadius: 999, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 })}
                  >
                    <Ionicons name="rocket-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontFamily: FontFamily.semibold, fontSize: 14 }}>Apply to become a host</Text>
                  </Pressable>

                  {!isAuthenticated && (
                    <Pressable
                      onPress={() => router.push({ pathname: '/(onboarding)/login', params: { redirectTo: '/pages/create' } } as never)}
                      style={({ pressed }) => ({ height: 44, borderRadius: 999, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}
                    >
                      <Text style={{ fontFamily: FontFamily.semibold, fontSize: 14, color: colors.text }}>Sign in</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Right column: What you can do (side by side) */}
              <View style={{ flex: 1, maxWidth: 380 }}>
                <Text style={{ fontFamily: FontFamily.bold, fontSize: 16, color: colors.text, marginBottom: 12 }}>What you can do as a host</Text>
                {HOST_PERKS.map((perk) => (
                  <View key={perk.icon} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: perk.color + '1A', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      <Ionicons name={perk.icon} size={16} color={perk.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FontFamily.semibold, fontSize: 14, color: colors.text }}>{perk.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>{perk.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            // Mobile: compact stacked, reduced top height
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CultureTokens.gold + '22', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 }}>
                <Ionicons name="lock-closed" size={12} color={CultureTokens.gold} />
                <Text style={{ fontFamily: FontFamily.semibold, fontSize: 11, color: CultureTokens.gold }}>{badgeLabel}</Text>
              </View>

              <Text style={{ fontFamily: FontFamily.bold, fontSize: 26, letterSpacing: -0.5, color: colors.text, marginBottom: 8 }}>
                {title}
              </Text>

              <Text style={{ fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary, marginBottom: 18 }}>
                {body}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => router.push({ pathname: '/(onboarding)/signup', params: { role: 'organizer', redirectTo: '/pages/create', intent: 'host' } } as never)}
                  style={({ pressed }) => ({ height: 44, borderRadius: 999, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 })}
                >
                  <Ionicons name="rocket-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: FontFamily.semibold, fontSize: 14 }}>Apply to become a host</Text>
                </Pressable>

                {!isAuthenticated && (
                  <Pressable
                    onPress={() => router.push({ pathname: '/(onboarding)/login', params: { redirectTo: '/pages/create' } } as never)}
                    style={({ pressed }) => ({ height: 44, borderRadius: 999, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}
                  >
                    <Text style={{ fontFamily: FontFamily.semibold, fontSize: 14, color: colors.text }}>Sign in</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>

        {/* Perks section (only on mobile, since desktop has it side-by-side above) */}
        {!isDesktop && (
          <View style={{ paddingHorizontal: hPad, backgroundColor: colors.background, paddingTop: Spacing.lg, paddingBottom: Spacing.xl }}>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: 17, color: colors.text, marginBottom: Spacing.md }}>
              What you can do as a host
            </Text>
            {HOST_PERKS.map((perk) => (
              <View key={perk.icon} style={{ flexDirection: 'row', gap: 12, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, marginBottom: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: perk.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={perk.icon} size={20} color={perk.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FontFamily.semibold, fontSize: 14, color: colors.text, marginBottom: 2 }}>{perk.title}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>{perk.desc}</Text>
                </View>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 6, paddingTop: 8 }}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.textTertiary} />
              <Text style={{ fontSize: 12, color: colors.textTertiary, flex: 1 }}>Host accounts are reviewed. Most applications approved within 24 hours.</Text>
            </View>
          </View>
        )}
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
 * `/hostspace` used this gate; `/pages/create` previously did not — fixed here.
 */
export function HostspaceAccessGate({ children, intent = 'hub' }: HostspaceAccessGateProps) {
  const { isAuthenticated, isLoading, isRestoring } = useAuth();
  const { isOrganizer, isLoading: roleLoading } = useRole();
  const colors = useColors();

  const isUnauthenticatedCreation = !isLoading && !isRestoring && !roleLoading && !isAuthenticated && intent === 'creationLab';

  React.useEffect(() => {
    if (isUnauthenticatedCreation) {
      router.replace({
        pathname: '/(onboarding)/signup',
        params: {
          role: 'organizer',
          redirectTo: '/pages/create',
          intent: 'host'
        }
      } as never);
    }
  }, [isUnauthenticatedCreation]);

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

  if (!isAuthenticated) {
    if (intent === 'creationLab') {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} accessibilityLabel="Loading" />
        </View>
      );
    }
    return <HostspaceGateScreen intent={intent} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 16,
  },
  statusIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  statusDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  timeline: {
    alignSelf: 'stretch',
    marginVertical: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: Spacing.sm,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 36,
    width: 2,
    height: 24,
  },
  timelineLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    flex: 1,
  },
  primaryCta: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  primaryCtaText: {
    color: '#fff',
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  secondaryCta: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryCtaText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
});
