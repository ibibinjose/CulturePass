import { View, Text, StyleSheet, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useLocalSearchParams, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/design-system/tokens/theme';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '@/modules/api';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { Button } from '@/design-system/ui/Button';
import { captureTicketPurchaseCompleted } from '@/lib/analytics';
import type { EventData } from '@/shared/schema';

export default function PaymentSuccessScreen() {
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const styles = getStyles(colors);
  const safeInsets = useSafeAreaInsetsWeb();
  const params = useLocalSearchParams<{ ticketId?: string | string[] }>();
  const ticketId = Array.isArray(params.ticketId) ? params.ticketId[0] : params.ticketId;
  const purchaseLoggedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(routeWithRedirect('/(onboarding)/login', '/payment/success'));
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isAuthenticated]);

  const { data: ticket } = useQuery({
    queryKey: ['/api/ticket', ticketId],
    queryFn: () => modulesApi.tickets.get(ticketId!),
    enabled: !!ticketId && isAuthenticated,
    staleTime: 60_000,
    refetchInterval: (query) => {
      const current = query.state.data;
      return current && current.paymentStatus !== 'paid' ? 2_000 : false;
    },
  });

  const purchaseComplete = Boolean(
    ticket &&
      (ticket.paymentStatus === 'paid' ||
        (!ticket.paymentStatus && ticket.status === 'confirmed')),
  );

  const { data: eventForAnalytics, isFetched: eventCtxFetched } = useQuery<EventData>({
    queryKey: ['/api/events', ticket?.eventId, 'post-purchase-analytics'],
    queryFn: () => modulesApi.events.get(ticket!.eventId) as Promise<EventData>,
    enabled: Boolean(ticket?.eventId && purchaseComplete && isAuthenticated),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!ticket || !purchaseComplete || purchaseLoggedRef.current) return;
    if (!eventCtxFetched) return;
    purchaseLoggedRef.current = true;
    captureTicketPurchaseCompleted({
      ticket_id: ticket.id,
      event_id: ticket.eventId,
      publisher_profile_id: eventForAnalytics?.publisherProfileId ?? null,
      venue_profile_id: eventForAnalytics?.venueProfileId ?? null,
      organizer_id: eventForAnalytics?.organizerId ?? null,
      quantity: ticket.quantity ?? 1,
      total_price_cents: ticket.totalPriceCents ?? null,
      source: 'payment_success_screen',
    });
  }, [ticket, purchaseComplete, eventCtxFetched, eventForAnalytics]);

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const eventTitle = ticket?.eventTitle ?? 'an event';
    const eventDate  = ticket?.eventDate  ?? '';
    const message = eventDate
      ? `I just got tickets to ${eventTitle} on ${eventDate} via CulturePass! 🎉`
      : `I just got tickets to ${eventTitle} via CulturePass! 🎉`;
    await Share.share({ message, url: 'https://culturepass.app' });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: safeInsets.top + 24,
          paddingBottom: safeInsets.bottom + 24,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>
          {purchaseComplete ? "You're going!" : 'Finalising payment'}
        </Text>
        {ticket ? (
          <>
            <Text style={[styles.eventTitle, { color: colors.text }]}>
              {ticket.eventTitle ?? 'Event'}
            </Text>
            {ticket.eventDate ? (
              <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                {ticket.eventDate}
                {ticket.eventTime ? ` · ${ticket.eventTime}` : ''}
              </Text>
            ) : null}
            {ticket.eventVenue ? (
              <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                {ticket.eventVenue}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your ticket is confirmed. Check your email for a receipt.
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {ticketId ? (
          <Button
            variant="primary"
            onPress={() => router.replace(`/tickets/${ticketId}`)}
            accessibilityLabel="View your ticket"
            disabled={!purchaseComplete}
          >
            {purchaseComplete ? 'View Ticket' : 'Ticket Processing'}
          </Button>
        ) : null}

        <Button
          variant="secondary"
          onPress={handleShare}
          accessibilityLabel="Share this event with friends"
        >
          Share with Friends
        </Button>

        <Button
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
          accessibilityLabel="Go back to home"
        >
          Back to Home
        </Button>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...TextStyles.hero,
    textAlign: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    ...TextStyles.title3,
    textAlign: 'center',
  },
  eventMeta: {
    ...TextStyles.cardBody,
    textAlign: 'center',
  },
  subtitle: {
    ...TextStyles.callout,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});
