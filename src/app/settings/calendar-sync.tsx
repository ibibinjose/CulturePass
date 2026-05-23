import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3TopAppBar, M3Button, GlassView } from '@/design-system/ui';
import { CultureTokens, FontFamily, Radius, ScreenTokens } from '@/design-system/tokens/theme';
import type { EventData, Ticket } from '@/shared/schema';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const IS_WEB = Platform.OS === 'web';

export default function CalendarSyncScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { userId, isAuthenticated } = useAuth();
  const bottomInset = IS_WEB ? 26 : insets.bottom;

  const {
    prefs,
    isLoading,
    isSyncing,
    permissionGranted,
    connectDeviceCalendar,
    disconnectDeviceCalendar,
    setShowPersonalEvents,
    setAutoAddTickets,
    exportAllTickets,
  } = useCalendarSync();

  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
  } = useQuery<Ticket[]>({
    queryKey: ['calendar-sync-tickets', userId],
    queryFn: () => modulesApi.tickets.forUser(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const activeTicketCount = useMemo(
    () => tickets.filter((t) => t.status === 'confirmed' || t.status === 'reserved' || t.status === 'used').length,
    [tickets],
  );

  const haptic = () => {
    if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  const handleDeviceToggle = useCallback(async () => {
    haptic();
    if (prefs.deviceConnected) {
      Alert.alert(
        'Disconnect calendar',
        'CulturePass will stop reading your busy times from device calendar.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => void disconnectDeviceCalendar() },
        ],
      );
      return;
    }
    await connectDeviceCalendar();
  }, [prefs.deviceConnected, connectDeviceCalendar, disconnectDeviceCalendar]);

  const handleExportTickets = useCallback(async () => {
    haptic();
    if (!isAuthenticated || !userId) {
      Alert.alert('Sign in required', 'Please sign in to sync your tickets to calendar.');
      return;
    }

    const active = tickets.filter((t) => t.status === 'confirmed' || t.status === 'reserved' || t.status === 'used');
    if (!active.length) {
      Alert.alert('No active tickets', 'You do not have active tickets to export.');
      return;
    }

    try {
      const ids = [...new Set(active.map((t) => t.eventId).filter(Boolean))];
      const settled = await Promise.allSettled(ids.map((id) => modulesApi.events.get(id)));
      const events = settled
        .filter((r): r is PromiseFulfilledResult<EventData> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (!events.length) {
        Alert.alert('Nothing to export', 'Could not load event details for your tickets right now.');
        return;
      }

      await exportAllTickets(events);
    } catch {
      Alert.alert('Export failed', 'Unable to sync tickets right now. Please try again.');
    }
  }, [isAuthenticated, userId, tickets, exportAllTickets]);

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
            colors={[`${colors.primary}08`, 'transparent']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
        />

        <M3TopAppBar
          title="Calendar Sync"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
          titleLeading={
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
              contentFit="contain"
            />
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: hPad,
              paddingBottom: bottomInset + 100,
            },
          ]}
        >
          <View style={isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%' }}>
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)}>
                <GlassView contentStyle={styles.heroContent}>
                    <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons
                            name={prefs.deviceConnected ? 'checkmark-circle' : 'calendar'}
                            size={24}
                            color={colors.primary}
                        />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.heroTitle, { color: colors.text }]}>
                            {prefs.deviceConnected ? 'Calendar Connected' : 'Connect Your Calendar'}
                        </Text>
                        <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                            Sync CulturePass tickets with Apple/Google calendar to avoid scheduling conflicts and stay updated.
                        </Text>
                    </View>
                </GlassView>
            </Animated.View>

            <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).duration(400)} style={styles.section}>
                <GlassView contentStyle={{ padding: 4 }}>
                    <Row
                        icon={IS_WEB ? 'download' : 'phone-portrait'}
                        iconColor={colors.primary}
                        title={IS_WEB ? 'Browser Export' : 'Device Connection'}
                        subtitle={
                            IS_WEB
                                ? 'On web, events export as standard .ics files.'
                                : permissionGranted
                                ? 'Calendar permission granted.'
                                : 'Calendar access is required on iOS/Android.'
                        }
                        right={
                            IS_WEB ? (
                                <View style={[styles.badge, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
                                    <Text style={{ fontSize: 10, fontFamily: FontFamily.bold, color: colors.primary }}>ICS</Text>
                                </View>
                            ) : (
                                <Switch
                                    value={prefs.deviceConnected}
                                    onValueChange={() => void handleDeviceToggle()}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#FFFFFF"
                                    ios_backgroundColor={colors.border}
                                />
                            )
                        }
                    />

                    {!IS_WEB && !permissionGranted && (
                        <>
                            <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
                            <Pressable
                                onPress={openSettings}
                                style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 }]}
                            >
                                <Ionicons name="settings-outline" size={16} color={colors.primary} />
                                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Open Device Settings</Text>
                            </Pressable>
                        </>
                    )}

                    <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />

                    <Row
                        icon="eye"
                        iconColor={CultureTokens.teal}
                        title="Show Personal Busy Blocks"
                        subtitle="Display device calendar occupancy within CulturePass."
                        right={
                            <Switch
                                value={prefs.showPersonalEvents}
                                onValueChange={(v) => void setShowPersonalEvents(v)}
                                trackColor={{ false: colors.border, true: CultureTokens.teal }}
                                thumbColor="#FFFFFF"
                                disabled={!prefs.deviceConnected}
                                ios_backgroundColor={colors.border}
                            />
                        }
                    />

                    <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />

                    <Row
                        icon="add-circle"
                        iconColor={CultureTokens.coral}
                        title="Auto-add New Tickets"
                        subtitle="Automatically push new purchases to your calendar."
                        right={
                            <Switch
                                value={prefs.autoAddTickets}
                                onValueChange={(v) => void setAutoAddTickets(v)}
                                trackColor={{ false: colors.border, true: CultureTokens.coral }}
                                thumbColor="#FFFFFF"
                                disabled={!prefs.deviceConnected && !IS_WEB}
                                ios_backgroundColor={colors.border}
                            />
                        }
                    />
                </GlassView>
            </Animated.View>

            <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(160).duration(400)} style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>MANUAL SYNC</Text>
                <GlassView contentStyle={{ padding: 20, gap: 20 }}>
                    <Row
                        icon="ticket"
                        iconColor={CultureTokens.gold}
                        title="Sync My Tickets Now"
                        subtitle={
                        isTicketsLoading
                            ? 'Loading your wallet...'
                            : `${activeTicketCount} active ticket${activeTicketCount === 1 ? '' : 's'} ready for export`
                        }
                        right={isTicketsLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                    />

                    <View style={styles.actionsRow}>
                        <M3Button
                            variant="outlined"
                            style={{ flex: 1 }}
                            onPress={() => void refetchTickets()}
                            leftIcon="refresh"
                            labelStyle={{ color: colors.textSecondary }}
                        >
                            Refresh
                        </M3Button>
                        <M3Button
                            variant="filled"
                            style={{ flex: 1.4 }}
                            onPress={() => void handleExportTickets()}
                            leftIcon="download-outline"
                        >
                            Sync Tickets
                        </M3Button>
                    </View>
                </GlassView>
            </Animated.View>
          </View>
        </ScrollView>

        {isSyncing ? (
          <View style={[styles.syncOverlay, { backgroundColor: colors.overlay }]}>
            <GlassView intensity={30} style={[styles.syncPill, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.syncText, { color: colors.text, fontFamily: FontFamily.bold }]}>Syncing...</Text>
            </GlassView>
          </View>
        ) : null}
      </View>
    </ErrorBoundary>
  );
}

function Row({
  icon,
  iconColor,
  title,
  subtitle,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '12' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: colors.textTertiary }]}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingTop: ScreenTokens.topOffset,
    gap: 16,
  },

  heroContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  heroSub: { fontSize: 13, fontFamily: FontFamily.medium, lineHeight: 18 },

  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12 },

  row: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontFamily: FontFamily.bold },
  rowSub: { fontSize: 12, fontFamily: FontFamily.medium, lineHeight: 16, opacity: 0.9 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  divider: { height: 1, marginLeft: 76 },
  actionBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: { fontSize: 13, fontFamily: FontFamily.bold },

  actionsRow: { flexDirection: 'row', gap: 12 },

  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  syncPill: {
    minHeight: 56,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncText: { fontSize: 15 },
});
