import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CultureTokens } from '@/design-system/tokens/theme';
import { eventsApi } from '@/modules/events/api';
import { queryClient } from '@/lib/query-client';
import { captureTicketPurchaseCompleted } from '@/lib/analytics';
import { getCurrencyForCountry } from '@/lib/currency';
import { routeWithRedirect } from '@/lib/routes';
import { isSafeExternalUrl, openExternalUrl } from '@/lib/openExternalUrl';
import type { EventData } from '@/shared/schema';
import { isWeb } from './utils';
import { eventPaths } from '@/modules/events/services/navigation';

type BuyMode = 'single' | 'family' | 'group';

export function useEventTicketing({
  event,
  userId,
  pathname,
  setTicketModalVisible,
}: {
  event: EventData;
  userId: string | null | undefined;
  pathname: string;
  setTicketModalVisible: (visible: boolean) => void;
}) {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buyMode, setBuyMode] = useState<BuyMode>('single');

  const eventTiers = event.tiers;
  const selectedTier = useMemo(
    () => eventTiers?.[selectedTierIndex] || { priceCents: 0, available: 0, name: 'Standard' },
    [eventTiers, selectedTierIndex],
  );

  const familySize = 4;
  const familyDiscount = 0.10;
  const groupDiscount = 0.15;

  const minQty = buyMode === 'group' ? 6 : 1;
  const maxQty = buyMode === 'family' ? 1 : Math.max(minQty, Math.min(20, selectedTier?.available || 20));

  const basePrice = selectedTier?.priceCents ?? 0;
  const rawTotal = buyMode === 'family' ? basePrice * familySize : basePrice * quantity;
  const discountRate = buyMode === 'family' ? familyDiscount : buyMode === 'group' ? groupDiscount : 0;
  const discountAmount = Math.round(rawTotal * discountRate);
  const totalPrice = rawTotal - discountAmount;
  const effectiveQty = buyMode === 'family' ? familySize : quantity;

  const handleExternalTicketPress = useCallback(async () => {
    const url = event.externalTicketUrl ?? event.externalUrl;
    if (!url) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    eventsApi.events.trackTicketClick(event.id).catch(() => {});
    try {
      const opened = await openExternalUrl(url, { failureTitle: 'Could not open ticket page' });
      if (!opened) throw new Error('Unsupported ticket URL');
    } catch {
      Alert.alert('Error', 'Could not open the ticket page.');
    }
  }, [event.id, event.externalTicketUrl, event.externalUrl]);

  const purchaseMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return eventsApi.stripe.createCheckoutSession(body as {
        eventId: string;
        eventTitle?: string;
        eventDate?: string;
        tierName?: string;
        quantity?: number;
        totalPriceCents?: number;
        currency?: string;
      });
    },
    onSuccess: async (data: { checkoutUrl?: string; ticketId?: string }) => {
      if (!data.checkoutUrl) return;
      if (!isSafeExternalUrl(data.checkoutUrl)) {
        Alert.alert('Error', 'Checkout link is not supported.');
        return;
      }
      setPaymentLoading(true);
      setTicketModalVisible(false);
      try {
        const result = await WebBrowser.openBrowserAsync(data.checkoutUrl, {
          dismissButtonStyle: 'cancel',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
        if ((result.type === 'cancel' || result.type === 'dismiss') && data.ticketId) {
          const ticketId = data.ticketId;
          const ticket = await eventsApi.tickets.get(ticketId);
          if (ticket.paymentStatus === 'paid' || ticket.status === 'confirmed') {
            captureTicketPurchaseCompleted({
              ticket_id: ticket.id,
              event_id: event.id,
              publisher_profile_id: event.publisherProfileId ?? null,
              venue_profile_id: event.venueProfileId ?? null,
              organizer_id: event.organizerId ?? null,
              quantity: ticket.quantity ?? effectiveQty,
              total_price_cents: ticket.totalPriceCents ?? totalPrice,
              source: 'stripe_web_checkout_return',
            });
            if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Ticket Purchased!', 'Your payment was successful.', [
              { text: 'View Ticket', onPress: () => router.push(eventPaths.ticket(ticketId)) },
              { text: 'OK' },
            ]);
          }
        }
      } catch {
        Alert.alert('Payment Error', 'Could not open payment page. Please try again.');
      } finally {
        setPaymentLoading(false);
      }
    },
    onError: (error: Error) => Alert.alert('Purchase Failed', error.message),
  });

  const purchaseFreeTicket = useCallback(async (body: Record<string, unknown>) => {
    try {
      const data = await eventsApi.tickets.purchase(body as { eventId: string; tierId?: string; quantity?: number });
      captureTicketPurchaseCompleted({
        ticket_id: data.id,
        event_id: event.id,
        publisher_profile_id: event.publisherProfileId ?? null,
        venue_profile_id: event.venueProfileId ?? null,
        organizer_id: event.organizerId ?? null,
        quantity: data.quantity ?? effectiveQty,
        total_price_cents: data.totalPriceCents ?? 0,
        source: 'free_ticket_in_app',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setTicketModalVisible(false);
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Ticket Confirmed!', 'Your free ticket has been reserved.', [
        { text: 'View Ticket', onPress: () => router.push(eventPaths.ticket(data.id)) },
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to reserve ticket. Please try again.');
    }
  }, [effectiveQty, event, setTicketModalVisible]);

  const handlePurchase = useCallback(() => {
    if (!userId) {
      Alert.alert('Login required', 'Please sign in to complete ticket purchase.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect(eventPaths.login, pathname)) },
      ]);
      return;
    }
    const ticketLabel =
      buyMode === 'family'
        ? `${selectedTier.name} (Family Pack)`
        : buyMode === 'group'
          ? `${selectedTier.name} (Group)`
          : selectedTier.name;
    const body = {
      userId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventVenue: event.venue,
      tierName: ticketLabel,
      quantity: effectiveQty,
      totalPriceCents: totalPrice,
      currency: getCurrencyForCountry(event?.country),
      imageColor: event.imageColor ?? CultureTokens.indigo,
    };
    if (totalPrice <= 0) {
      purchaseFreeTicket(body);
      return;
    }
    
    setTicketModalVisible(false);
    router.push({
      pathname: '/checkout',
      params: {
        eventId: event.id,
        tierName: ticketLabel,
        quantity: String(effectiveQty),
        priceCents: String(selectedTier.priceCents ?? 0),
      },
    });
  }, [buyMode, effectiveQty, event, pathname, purchaseFreeTicket, selectedTier, totalPrice, userId, setTicketModalVisible]);

  return {
    eventTiers,
    isPurchasing: purchaseMutation.isPending,
    paymentLoading,
    selectedTierIndex,
    setSelectedTierIndex,
    quantity,
    setQuantity,
    buyMode,
    setBuyMode,
    selectedTier,
    minQty,
    maxQty,
    rawTotal,
    discountAmount,
    totalPrice,
    effectiveQty,
    handleExternalTicketPress,
    handlePurchase,
  };
}
