import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3TopAppBar, M3Button } from '@/design-system/ui';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';
import { ticketKeys } from '@/hooks/queries/keys';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily } from '@/design-system/tokens/theme';
import type { Ticket } from '@/shared/schema';
import { cancelUserTicket, fetchUserTickets } from '@/services/ticketsService';
import { GlassView } from '@/design-system/ui/GlassView';

const IS_WEB = Platform.OS === 'web';

function parseDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(raw?: string | null): string {
  const d = parseDate(raw);
  if (!d) return 'Date TBA';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatMoney(cents?: number | null, currency?: string | null): string {
  const value = (cents ?? 0) / 100;
  const c = (currency || 'AUD').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function ticketState(t: Ticket): 'upcoming' | 'past' | 'cancelled' {
  if (t.status === 'cancelled') return 'cancelled';
  if (t.status === 'used' || t.status === 'expired') return 'past';
  const d = parseDate(t.eventDate || null);
  if (d && d.getTime() < Date.now()) return 'past';
  return 'upcoming';
}

async function shareTicket(t: Ticket) {
  const url = t.eventId ? `https://culturepass.app/e/${t.eventId}` : 'https://culturepass.app';
  const msg = `${t.eventTitle}\n${formatDate(t.eventDate || null)}${t.eventTime ? ` · ${t.eventTime}` : ''}\n${t.eventVenue || 'Venue TBA'}\n\n${url}`;
  try {
    await Share.share({ title: t.eventTitle, message: msg, url });
  } catch {
    // ignore user cancel
  }
}

function TicketCard({
  ticket,
  onCancel,
}: {
  ticket: Ticket;
  onCancel: (t: Ticket) => void;
}) {
  const colors = useColors();
  const state = ticketState(ticket);
  const isUpcoming = state === 'upcoming';
  const statusText =
    state === 'upcoming' ? 'Upcoming' : state === 'cancelled' ? 'Cancelled' : 'Past';
  const statusColor =
    state === 'upcoming' ? CultureTokens.teal : state === 'cancelled' ? CultureTokens.coral : colors.textTertiary;

  return (
    <GlassView
      style={styles.ticketOuter}
      contentStyle={styles.ticketContent}
    >
      <Pressable
        onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: ticket.id } })}
        style={({ pressed }) => [
          styles.ticketTap,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View ticket for ${ticket.eventTitle}`}
      >
        <View style={styles.rowBetween}>
          <GlassView intensity={10} style={[styles.statusPill, { backgroundColor: statusColor + '15', borderColor: statusColor + '30', borderWidth: 1 }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </GlassView>
          <Text style={[styles.price, { color: colors.text }]}>
            {formatMoney(ticket.totalPriceCents, ticket.currency)}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {ticket.eventTitle || 'Event Ticket'}
        </Text>

        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <View style={[styles.metaIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="calendar" size={12} color={colors.primary} />
            </View>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(ticket.eventDate || null)}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.metaIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="time" size={12} color={colors.primary} />
            </View>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{ticket.eventTime || 'Time TBA'}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.metaIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="location" size={12} color={colors.primary} />
            </View>
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {ticket.eventVenue || 'Venue TBA'}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />

        <View style={styles.rowBetween}>
          <Text style={[styles.small, { color: colors.textTertiary }]}>
            {ticket.tierName || 'Standard'} • {ticket.quantity || 1} {ticket.quantity === 1 ? 'ticket' : 'tickets'}
          </Text>
          <View style={styles.actionsInline}>
            <Pressable
                onPress={() => void shareTicket(ticket)}
                style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.primarySoft }, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Share ticket"
            >
              <Ionicons name="share-social" size={16} color={colors.primary} />
            </Pressable>
            {isUpcoming ? (
              <Pressable
                onPress={() => onCancel(ticket)}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel ticket"
              >
                <Text style={[styles.cancelText, { color: CultureTokens.coral }]}>Cancel</Text>
              </Pressable>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
        </View>
      </Pressable>
    </GlassView>
  );
}

export default function TicketsScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const bottomInset = IS_WEB ? 20 : insets.bottom;

  const {
    data: tickets = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery<Ticket[]>({
    queryKey: ticketKeys.forUser(userId ?? ''),
    queryFn: () => fetchUserTickets(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (ticketId: string) => cancelUserTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.forUser(userId ?? '') });
      Alert.alert('Ticket cancelled', 'Your ticket has been cancelled.');
    },
    onError: () => {
      Alert.alert('Cancellation failed', 'Please try again.');
    },
  });

  const grouped = useMemo(() => {
    const upcoming: Ticket[] = [];
    const past: Ticket[] = [];
    const cancelled: Ticket[] = [];
    for (const t of tickets) {
      const s = ticketState(t);
      if (s === 'upcoming') upcoming.push(t);
      else if (s === 'past') past.push(t);
      else cancelled.push(t);
    }
    return { upcoming, past, cancelled };
  }, [tickets]);

  const askCancel = (ticket: Ticket) => {
    Alert.alert('Cancel ticket', `Cancel "${ticket.eventTitle}"?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Ticket',
        style: 'destructive',
        onPress: () => {
          if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          cancelMutation.mutate(ticket.id);
        },
      },
    ]);
  };

  return (
    <AuthGuard icon="ticket-outline" title="My Tickets" message="Sign in to view and manage your tickets.">
      <ErrorBoundary>
        <Stack.Screen options={{ title: 'My Tickets | CulturePass' }} />
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <M3TopAppBar
            title="My Tickets"
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my-space'))}
            variant="small"
            titleLeading={
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
                contentFit="contain"
              />
            }
            denseWeb={IS_WEB}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: hPad,
              paddingTop: 16,
              paddingBottom: bottomInset + 100,
              alignSelf: 'center',
              width: '100%',
              maxWidth: isDesktop ? 800 : undefined,
            }}
          >
            {isLoading ? (
              <View style={{ gap: 16 }}>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, padding: 20 }]}>
                    <Skeleton width="40%" height={24} borderRadius={8} />
                    <Skeleton width="100%" height={32} borderRadius={8} style={{ marginTop: 16 }} />
                    <Skeleton width="60%" height={20} borderRadius={8} style={{ marginTop: 12 }} />
                    <View style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: 16, opacity: 0.5 }} />
                    <Skeleton width="30%" height={20} borderRadius={8} />
                  </View>
                ))}
              </View>
            ) : isError ? (
              <View style={styles.stateWrap}>
                <GlassView contentStyle={styles.statePanel}>
                    <Ionicons name="alert-circle" size={48} color={CultureTokens.coral} />
                    <Text style={[styles.stateTitle, { color: colors.text }]}>Could not load tickets</Text>
                    <Text style={[styles.stateSub, { color: colors.textSecondary }]}>We encountered a problem fetching your wallet. Check your connection and try again.</Text>
                    <M3Button onPress={() => void refetch()} variant="filled" style={{ marginTop: 8 }}>Try Again</M3Button>
                </GlassView>
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.stateWrap}>
                <GlassView contentStyle={styles.statePanel}>
                    <View style={[styles.stateIcon, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="ticket" size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.stateTitle, { color: colors.text }]}>No tickets yet</Text>
                    <Text style={[styles.stateSub, { color: colors.textSecondary }]}>
                    Your cultural journey starts here. Book an event and your tickets will appear in this wallet.
                    </Text>
                    <M3Button onPress={() => router.push('/events')} variant="filled" style={{ marginTop: 8 }}>Discover Events</M3Button>
                </GlassView>
              </View>
            ) : (
              <>
                {grouped.upcoming.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                      Upcoming ({grouped.upcoming.length})
                    </Text>
                    {grouped.upcoming.map((t) => (
                      <TicketCard key={t.id} ticket={t} onCancel={askCancel} />
                    ))}
                  </View>
                ) : null}

                {grouped.past.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                      Past ({grouped.past.length})
                    </Text>
                    {grouped.past.map((t) => (
                      <TicketCard key={t.id} ticket={t} onCancel={askCancel} />
                    ))}
                  </View>
                ) : null}

                {grouped.cancelled.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                      Cancelled ({grouped.cancelled.length})
                    </Text>
                    {grouped.cancelled.map((t) => (
                      <TicketCard key={t.id} ticket={t} onCancel={askCancel} />
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </ErrorBoundary>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { marginBottom: 32 },
  sectionLabel: {
    marginBottom: 14,
    fontSize: 12,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },

  ticketOuter: {
    marginBottom: 16,
  },
  ticketContent: {
    padding: 0,
  },
  ticketTap: {
    padding: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  price: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  title: {
    marginTop: 12,
    fontSize: 20,
    fontFamily: FontFamily.bold,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  metaList: { marginTop: 14, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  divider: { height: 1, marginVertical: 18 },
  small: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsInline: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },

  skeletonCard: {
    borderRadius: 20,
    borderWidth: 1,
  },

  stateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  statePanel: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  stateIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.5,
  },
  stateSub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    opacity: 0.8,
  },
});
