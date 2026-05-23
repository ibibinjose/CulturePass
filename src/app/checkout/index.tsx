// app/checkout/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { M3Button, M3Card } from '@/design-system/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '@/modules/api';
import type { EventData } from '@/shared/schema';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { BlurView } from 'expo-blur';
import Animated, { SlideInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { getCurrencyForCountry, formatCurrency } from '@/lib/currency';
import { captureTicketPurchaseCompleted } from '@/lib/analytics';
import { useSafeBack } from '@/lib/navigation';

const isWeb = Platform.OS === 'web';

export default function CheckoutPage() {
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const dismissCheckout = useSafeBack(eventId ? `/e/${eventId}` : '/(tabs)');
  const tierName = params.tierName as string;
  const quantity = parseInt((params.quantity as string) || '1', 10);
  const basePriceCents = parseInt((params.priceCents as string) || '0', 10);

  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { userId } = useAuth();

  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [validatedPromoCode, setValidatedPromoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: event, isLoading: eventLoading } = useQuery<EventData>({
    queryKey: ['/api/events', eventId],
    queryFn: () => modulesApi.events.get(eventId) as Promise<EventData>,
    enabled: !!eventId,
  });

  const totalPriceCents = Math.max(0, (basePriceCents * quantity) - promoDiscount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !eventId) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPromoLoading(true);
    try {
      const quote = await modulesApi.events.ticketQuote(eventId, { quantity, tierName, promoCode: promoCode.trim() });
      if (quote.discountCents > 0) {
        setPromoDiscount(quote.discountCents);
        setValidatedPromoCode(promoCode.trim());
      } else {
        Alert.alert('Invalid', 'Promo code not found or not applicable.');
      }
    } catch {
      Alert.alert('Error', 'Could not validate promo code. Try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!userId) {
      Alert.alert('Login Required', 'You must be signed in to purchase tickets.');
      return;
    }
    setLoading(true);
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (totalPriceCents === 0) {
        const t = await modulesApi.tickets.purchase({ eventId, tierId: tierName, quantity, promoCode: validatedPromoCode ?? undefined });
        if (event) {
          captureTicketPurchaseCompleted({
            ticket_id: t.id,
            event_id: event.id,
            publisher_profile_id: event.publisherProfileId ?? null,
            venue_profile_id: event.venueProfileId ?? null,
            organizer_id: event.organizerId ?? null,
            quantity: t.quantity ?? quantity,
            total_price_cents: t.totalPriceCents ?? 0,
            source: 'checkout_free_ticket',
          });
        }
        router.replace('/(tabs)');
        return;
      }
      const session = await modulesApi.stripe.createCheckoutSession({
        eventId, eventTitle: event?.title, eventDate: event?.date,
        tierName, quantity, totalPriceCents, currency: getCurrencyForCountry(event?.country),
        promoCode: validatedPromoCode ?? undefined,
      });
      if (session.checkoutUrl) {
        if (isWeb) window.location.href = session.checkoutUrl;
        else await WebBrowser.openBrowserAsync(session.checkoutUrl);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (eventLoading) {
    return (
      <View style={styles.screen}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissCheckout}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Skeleton width={150} height={28} borderRadius={14} />
            <View style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </View>
          </View>
          <View style={styles.content}>
            <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={140} borderRadius={24} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={52} borderRadius={16} style={{ marginBottom: 32 }} />
            <View style={styles.footer}>
              <View style={[styles.row, { marginBottom: 24 }]}>
                <Skeleton width={80} height={32} borderRadius={8} />
                <Skeleton width={120} height={32} borderRadius={8} />
              </View>
              <Skeleton width="100%" height={60} borderRadius={20} />
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismissCheckout}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Confirm Order</Text>
          <Pressable
            onPress={dismissCheckout}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.steps}>
            <View style={[styles.stepDot, { backgroundColor: CultureTokens.indigo }]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, { backgroundColor: CultureTokens.indigo }]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, { backgroundColor: colors.borderLight }]} />
          </View>

          <View style={styles.eventInfo}>
            <Image
              source={event?.heroImageUrl ? { uri: event.heroImageUrl } : require('@/assets/images/culturepass-logo.png')}
              style={styles.eventThumb}
              contentFit="cover"
              accessibilityLabel="Event poster"
            />
            <View style={styles.eventText}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event?.title}</Text>
              <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>{event?.date} • {event?.venue}</Text>
            </View>
          </View>

          <M3Card variant="filled" style={styles.summaryCard}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Ticket</Text>
              <Text style={[styles.value, { color: colors.text }]}>{tierName}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity</Text>
              <Text style={[styles.value, { color: colors.text }]}>{quantity}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formatCurrency(basePriceCents * quantity, event?.country)}</Text>
            </View>
          </M3Card>

          <View style={styles.promoWrap}>
            <TextInput
              style={[styles.promoInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
              placeholder="Promo Code"
              placeholderTextColor={colors.textTertiary}
              value={promoCode}
              onChangeText={setPromoCode}
              accessibilityLabel="Promo code"
              autoCapitalize="characters"
            />
            <M3Button variant="filled" loading={promoLoading} onPress={() => void handleApplyPromo()} style={styles.promoBtn}>Apply</M3Button>
          </View>

          <View style={styles.footer}>
            <View style={styles.row}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: CultureTokens.gold }]}>
                {totalPriceCents === 0 ? 'Free' : formatCurrency(totalPriceCents, event?.country)}
              </Text>
            </View>
            {promoDiscount > 0 && (
              <Text style={styles.discountTag}>-{formatCurrency(promoDiscount, event?.country)} promo applied</Text>
            )}

            <M3Button
              variant="filled"
              loading={loading}
              onPress={handleCheckout}
              style={styles.payBtn}
            >
              {totalPriceCents === 0 ? 'Complete Order' : 'Checkout & Pay'}
            </M3Button>
            <Text style={[styles.secureText, { color: colors.textTertiary }]}>
              <Ionicons name="lock-closed" size={10} /> Secure checkout powered by Stripe
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end' },
  sheet: { 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    height: '85%', 
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px -8px 32px rgba(0,0,0,0.4)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
      },
      android: { elevation: 24 }
    })
  },
  handle: { width: 44, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  headerTitle: { ...TextStyles.title },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingTop: 0 },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, alignSelf: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { width: 32, height: 2, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 8 },
  eventInfo: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  eventThumb: { width: 80, height: 80, borderRadius: 16 },
  eventText: { flex: 1, justifyContent: 'center' },
  eventTitle: { ...TextStyles.title3 },
  eventMeta: { ...TextStyles.chip, marginTop: 4 },
  summaryCard: { borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.02)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...TextStyles.label },
  value: { ...TextStyles.cardTitle },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 16 },
  promoWrap: { flexDirection: 'row', gap: 12, marginTop: 24 },
  promoInput: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, ...TextStyles.label },
  promoBtn: { borderRadius: 12 },
  footer: { marginTop: 32 },
  totalLabel: { ...TextStyles.hero },
  totalValue: { ...TextStyles.hero },
  discountTag: { ...TextStyles.captionSemibold, color: CultureTokens.teal, marginTop: 4 },
  payBtn: { marginTop: 24, height: 60, borderRadius: 20 },
  payBtnText: { color: '#fff', ...TextStyles.title3 },
  secureText: { textAlign: 'center', marginTop: 16, ...TextStyles.badge, opacity: 0.6 },
});
