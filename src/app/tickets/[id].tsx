import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, getQueryFn } from '@/lib/query-client';
import { modulesApi,  ApiError } from '@/modules/api';
import { siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '@shared/schema';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily } from '@/design-system/tokens/theme';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { GlassView } from '@/design-system/ui/GlassView';


function parseWalletApiError(err: ApiError): string {
  const raw = err.message.replace(/^\d{3}:\s*/, '');
  const paren = raw.indexOf(' (http');
  const jsonSlice = paren >= 0 ? raw.slice(0, paren) : raw;
  try {
    const o = JSON.parse(jsonSlice) as { error?: string; missing?: string[]; code?: string };
    if (o.error && o.missing?.length) {
      return `${o.error}\n\nMissing: ${o.missing.join(', ')}`;
    }
    if (o.error) return o.error;
  } catch {
    /* use fallback */
  }
  return paren >= 0 ? raw.slice(0, paren) : raw;
}

function TicketDetailAmbientMesh() {
  const colors = useColors();
  return (
    <LinearGradient
      colors={[`${colors.primary}12`, 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFillObject]}
      pointerEvents="none"
    />
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    const date = new Date(y!, m! - 1, d);
    return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const QR_CACHE_PREFIX = '@culturepass_ticket_qr:';

function cacheTicketQr(ticketId: string, qrCode: string) {
  AsyncStorage.setItem(`${QR_CACHE_PREFIX}${ticketId}`, qrCode).catch((err) => {
    if (__DEV__) console.warn('QR cache write failed:', err);
  });
}

async function getCachedTicketQr(ticketId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${QR_CACHE_PREFIX}${ticketId}`);
  } catch {
    return null;
  }
}

export default function TicketDetailScreen() {
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const s = getStyles(colors);
  const { isDesktop, hPad, isWeb } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(routeWithRedirect('/(onboarding)/login', `/tickets/${id}`));
    }
  }, [isAuthenticated, id]);
  
  const topInset = isDesktop ? 0 : (isWeb ? 0 : insets.top);
  const bottomInset = isWeb ? 34 : insets.bottom;

  const [cachedQr, setCachedQr] = useState<string | null>(null);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['/api/ticket', id],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!id,
  });

  useEffect(() => {
    if (ticket?.qrCode && id) {
      cacheTicketQr(id as string, ticket.qrCode);
    }
  }, [ticket?.qrCode, id]);

  useEffect(() => {
    if (id) {
      getCachedTicketQr(id as string).then(setCachedQr);
    }
  }, [id]);

  const cancelMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return modulesApi.stripe.refund(ticketId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const msg = data.refundId
        ? 'Your ticket has been cancelled and a refund has been initiated to your card.'
        : 'Your ticket has been cancelled.';
      Alert.alert('Ticket Cancelled', msg);
    },
    onError: (error: Error) => {
      Alert.alert('Refund Failed', error.message || 'Could not process the refund. Please try again.');
    },
  });

  const handleCancel = useCallback(() => {
    if (!ticket) return;
    const hasPayment = !!ticket.stripePaymentIntentId;
    const title = hasPayment ? 'Cancel & Refund' : 'Cancel Ticket';
    const message = hasPayment
      ? `Are you sure you want to cancel your ticket for "${ticket.eventTitle}"? A refund will be processed to your card.`
      : `Are you sure you want to cancel your ticket for "${ticket.eventTitle}"?`;
    Alert.alert(title, message, [
      { text: 'Keep Ticket', style: 'cancel' },
      {
        text: hasPayment ? 'Cancel & Refund' : 'Cancel Ticket',
        style: 'destructive',
        onPress: () => {
          if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          cancelMutation.mutate(ticket.id);
        },
      },
    ]);
  }, [ticket, cancelMutation, isWeb]);

  const handleShare = useCallback(async () => {
    if (!ticket) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = siteUrl(`/tickets/${ticket.id}`);
      await Share.share({
        title: ticket.eventTitle,
        message: `I'm going to ${ticket.eventTitle}! 🎫\n${ticket.eventVenue ? `📍 ${ticket.eventVenue}` : ''}\n${ticket.eventDate ? `📅 ${formatDate(ticket.eventDate)}` : ''}\n\nTicket Code: ${ticket.ticketCode || 'N/A'}\n\nGet yours on CulturePass!\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {}
  }, [ticket, isWeb]);

  const handlePrint = useCallback(() => {
    if (!ticket) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/tickets/print/[id]',
      params: { id: ticket.id, layout: ticket.status === 'used' ? 'badge' : 'full', autoPrint: '1' },
    });
  }, [ticket, isWeb]);

  const handleAddToWallet = useCallback(async (walletType: 'apple' | 'google') => {
    if (!ticket) return;
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const walletName = walletType === 'apple' ? 'Apple Wallet' : 'Google Wallet';
    const destinationHint =
      walletType === 'apple'
        ? 'You’ll open a secure download link, then add the pass in Apple Wallet.'
        : 'You’ll open Google Wallet to save this ticket.';
    Alert.alert(`Add to ${walletName}`, `Your ticket for "${ticket.eventTitle}".\n\n${destinationHint}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: async () => {
          try {
            const raw = walletType === 'apple'
              ? await modulesApi.tickets.walletApple(ticket.id)
              : await modulesApi.tickets.walletGoogle(ticket.id);
            const data = raw as typeof raw & { code?: string };
            if (data.url) {
              await openExternalUrl(data.url, { failureTitle: `Could not open ${walletName}` });
            } else if (data.code === 'WALLET_NOT_IMPLEMENTED') {
              Alert.alert('Unavailable', `${walletName} is not enabled for this build yet.`);
            } else {
              Alert.alert('Unavailable', `No ${walletName} link was returned. Try again later.`);
            }
          } catch (e) {
            const msg = e instanceof ApiError ? parseWalletApiError(e) : (e instanceof Error ? e.message : 'Request failed.');
            const title = e instanceof ApiError && e.status === 503 ? 'Wallet not ready' : 'Could not add pass';
            Alert.alert(title, msg);
          }
        },
      },
    ]);
  }, [ticket, isWeb]);

  if (isLoading) {
    return (
      <View style={s.container}>
        <TicketDetailAmbientMesh />
        <AppHeaderBar title="Ticket Details" backFallback="/tickets/index" topInset={topInset} />
        <View style={isDesktop && s.desktopShellWrapper}>
          <View style={isDesktop && s.desktopShell}>
            <View style={{ paddingTop: 12, paddingHorizontal: hPad }}>
              <View style={[s.skeletonTicket, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <Skeleton width="100%" height={140} borderRadius={0} />
                <View style={{ padding: 24, gap: 16 }}>
                  <Skeleton width="80%" height={28} borderRadius={8} />
                  <Skeleton width={140} height={20} borderRadius={10} />
                  <View style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: 8, opacity: 0.5 }} />
                  <Skeleton width="60%" height={24} borderRadius={8} />
                  <Skeleton width="40%" height={24} borderRadius={8} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={s.container}>
        <TicketDetailAmbientMesh />
        <AppHeaderBar title="Ticket Details" backFallback="/tickets/index" topInset={topInset} />
        <View style={isDesktop && s.desktopShellWrapper}>
          <View style={isDesktop && s.desktopShell}>
            <View style={s.loadingState}>
              <GlassView contentStyle={{ padding: 40, alignItems: 'center', gap: 20 }}>
                <Ionicons name="ticket-outline" size={64} color={colors.textTertiary} />
                <Text style={s.emptyTitle}>Ticket Not Found</Text>
                <Text style={s.emptySubtitle}>This ticket may have been removed or cancelled.</Text>
                <Pressable 
                  style={({ pressed }) => [s.primaryButton, pressed && s.primaryButtonPressed, { width: '100%', marginTop: 10 }]}
                  onPress={() => router.push('/tickets/index')}
                >
                  <Text style={s.primaryButtonText}>View My Wallet</Text>
                </Pressable>
              </GlassView>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const ticketStatus = ticket.status as string | null;
  const statusInfo =
    ticketStatus === 'confirmed' ? { color: CultureTokens.teal,      bg: CultureTokens.teal + '15',      label: 'Confirmed',      icon: 'checkmark-circle' as const } :
    ticketStatus === 'pending'   ? { color: CultureTokens.gold,   bg: CultureTokens.gold + '15',   label: 'Processing',icon: 'time'             as const } :
    ticketStatus === 'used'      ? { color: colors.textSecondary,    bg: colors.borderLight,             label: 'Scanned',        icon: 'checkmark-done'   as const } :
    ticketStatus === 'cancelled' ? { color: CultureTokens.coral,     bg: CultureTokens.coral + '15',     label: 'Cancelled',      icon: 'close-circle'     as const } :
                                   { color: colors.textSecondary,    bg: colors.borderLight,             label: ticketStatus || 'Unknown', icon: 'help-circle' as const };

  const isActive  = ticket.status === 'confirmed';
  const isScanned = ticket.status === 'used';
  const bannerColor = ticket.imageColor || colors.primary;

  return (
    <View style={s.container}>
      <TicketDetailAmbientMesh />
      <AppHeaderBar
        title="Ticket Details"
        backFallback="/tickets/index"
        topInset={topInset}
        rightAction={{ icon: 'share-outline', onPress: handleShare, label: 'Share' }}
      />
      <View style={[isDesktop && s.desktopShellWrapper]}>
        <View style={[isDesktop && s.desktopShell, { paddingHorizontal: hPad }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 + bottomInset, paddingTop: 16 }}>
            {/* Ticket card */}
            <GlassView style={s.ticketContainer} contentStyle={{ padding: 0 }}>
              <View style={[s.ticketTop, { backgroundColor: bannerColor }]}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.ticketTopOverlay}>
                  <GlassView intensity={20} colorScheme="dark" style={[s.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '40', borderWidth: 1 }]}>
                    <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                    <Text style={[s.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </GlassView>
                  <Ionicons name="ticket" size={36} color="rgba(255,255,255,0.7)" />
                </View>
              </View>

              {/* Tear notch matching dynamic background color */}
              <View style={s.ticketNotchContainer}>
                 <View style={[s.ticketNotch, { borderColor: colors.borderLight }]}>
                   <View style={[s.notchCircle, s.notchLeft, { backgroundColor: colors.background, borderColor: colors.borderLight }]} />
                   <View style={[s.notchLine, { borderColor: colors.borderLight, opacity: 0.3 }]} />
                   <View style={[s.notchCircle, s.notchRight, { backgroundColor: colors.background, borderColor: colors.borderLight }]} />
                 </View>
              </View>

              <View style={s.ticketBody}>
                <Text style={s.eventTitle}>{ticket.eventTitle}</Text>

                <View style={s.cpidRow}>
                  <Ionicons name="finger-print" size={16} color={colors.primary} />
                  <Text style={[s.cpidText, { color: colors.primary }]}>ID: {ticket.culturePassId || ticket.cpTicketId || ticket.id}</Text>
                </View>

                <View style={s.infoGrid}>
                  {ticket.eventDate && (
                    <View style={s.infoItem}>
                      <View style={[s.infoIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="calendar" size={18} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[s.infoLabel, { color: colors.textTertiary }]}>Date</Text>
                        <Text style={[s.infoValue, { color: colors.text }]}>{formatDate(ticket.eventDate)}</Text>
                      </View>
                    </View>
                  )}
                  {ticket.eventTime && (
                    <View style={s.infoItem}>
                      <View style={[s.infoIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="time" size={18} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[s.infoLabel, { color: colors.textTertiary }]}>Time</Text>
                        <Text style={[s.infoValue, { color: colors.text }]}>{ticket.eventTime}</Text>
                      </View>
                    </View>
                  )}
                  {ticket.eventVenue && (
                    <View style={s.infoItem}>
                      <View style={[s.infoIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="location" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.infoLabel, { color: colors.textTertiary }]}>Venue</Text>
                        <Text style={[s.infoValue, { color: colors.text }]} numberOfLines={2}>{ticket.eventVenue}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={[s.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />

                <View style={s.detailsRow}>
                  <View style={s.detailItem}>
                    <Text style={[s.detailLabel, { color: colors.textTertiary }]}>Tier</Text>
                    <Text style={[s.detailValue, { color: colors.text }]}>{ticket.tierName || 'Standard'}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={[s.detailLabel, { color: colors.textTertiary }]}>Quantity</Text>
                    <Text style={[s.detailValue, { color: colors.text }]}>{ticket.quantity || 1}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={[s.detailLabel, { color: colors.textTertiary }]}>Total</Text>
                    <Text style={[s.detailValue, { color: colors.primary }]}>
                      ${((ticket.totalPriceCents || 0) / 100).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {ticket.ticketCode && (
                  <>
                    <View style={[s.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
                    <View style={s.qrSection}>
                      <Text style={[s.qrTitle, { color: colors.text }]}>
                        {isScanned ? 'SCANNED AT ENTRY' : isActive ? 'SCAN FOR ADMISSION' : 'TICKET CODE'}
                      </Text>
                      {(ticket.qrCode || cachedQr) && isActive ? (
                        <View style={[s.qrImageContainer, { borderColor: colors.borderLight }]}>
                           <Image source={{ uri: ticket.qrCode ?? cachedQr ?? '' }} style={s.qrImage} contentFit="contain" />
                        </View>
                      ) : isScanned ? (
                        <View style={s.scannedOverlay}>
                          <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
                          <Text style={[s.scannedText, { color: colors.text }]}>Checked In</Text>
                          {ticket.scannedAt && (
                            <Text style={[s.scannedTime, { color: colors.textTertiary }]}>
                              {new Date(ticket.scannedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </Text>
                          )}
                        </View>
                      ) : null}
                      <Text style={[s.ticketCodeText, { color: colors.primary }]}>{ticket.ticketCode}</Text>
                    </View>
                  </>
                )}
              </View>
            </GlassView>

            {/* Add to wallet */}
            {isActive && (
              <View style={s.walletSection}>
                <Text style={[s.walletTitle, { color: colors.textTertiary }]}>Store in your wallet</Text>
                <View style={s.walletButtons}>
                  {(Platform.OS === 'ios' || isWeb) && (
                    <Pressable 
                      style={({pressed}) => [s.walletBtn, { backgroundColor: '#111111', borderWidth: 1, borderColor: '#333' }, pressed && { opacity: 0.8 }]} 
                      onPress={() => handleAddToWallet('apple')}
                    >
                      <Ionicons name="wallet" size={20} color="#FFF" />
                      <Text style={s.walletBtnTextApple}>Apple Wallet</Text>
                    </Pressable>
                  )}
                  <Pressable 
                    style={({pressed}) => [s.walletBtn, { backgroundColor: '#4285F4' }, pressed && { opacity: 0.8 }]} 
                    onPress={() => handleAddToWallet('google')}
                  >
                    <Ionicons name="logo-google" size={18} color="#FFF" />
                    <Text style={s.walletBtnTextGoogle}>Google Wallet</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Actions list */}
            <GlassView style={s.actionsSection} contentStyle={{ padding: 4 }}>
              <Pressable
                style={({pressed}) => [s.actionBtn, { borderBottomColor: colors.borderLight }, pressed && { backgroundColor: colors.primarySoft }]}
                onPress={() => router.push({ pathname: '/e/[id]', params: { id: ticket.eventId } })}
              >
                <View style={[s.actionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <Text style={[s.actionText, { color: colors.text }]}>View Event Details</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              <Pressable 
                style={({pressed}) => [s.actionBtn, { borderBottomColor: colors.borderLight }, pressed && { backgroundColor: colors.primarySoft }]}
                onPress={handleShare}
              >
                <View style={[s.actionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="share-social" size={20} color={colors.primary} />
                </View>
                <Text style={[s.actionText, { color: colors.text }]}>Share Ticket</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              {(isActive || isScanned) && (
                <Pressable 
                   style={({pressed}) => [s.actionBtn, { borderBottomColor: colors.borderLight }, pressed && { backgroundColor: colors.primarySoft }]}
                   onPress={handlePrint}
                >
                  <View style={[s.actionIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="print" size={20} color={colors.primary} />
                  </View>
                  <Text style={[s.actionText, { color: colors.text }]}>Print Ticket</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              )}

              {isActive && (
                <Pressable 
                  style={({pressed}) => [s.actionBtn, { borderBottomWidth: 0 }, pressed && { backgroundColor: colors.primarySoft }]}
                  onPress={handleCancel}
                >
                  <View style={[s.actionIcon, { backgroundColor: CultureTokens.coral + '15' }]}>
                    <Ionicons name="close-circle" size={20} color={CultureTokens.coral} />
                  </View>
                  <Text style={[s.actionText, { color: CultureTokens.coral }]}>Cancel & Refund</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </GlassView>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  desktopShellWrapper: { flex: 1, alignItems: 'center' },
  desktopShell:    { width: '100%', maxWidth: 600 },

  loadingState:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle:         { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5, color: colors.text, textAlign: 'center' },
  emptySubtitle:      { fontSize: 16, fontFamily: FontFamily.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  primaryButton:      { 
    backgroundColor: colors.primary,
    paddingVertical: 16, 
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: { opacity: 0.9 },
  primaryButtonText:  { fontSize: 16, fontFamily: FontFamily.bold, color: '#FFFFFF' },

  skeletonTicket: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },

  ticketContainer: { 
    borderRadius: 28,
  },
  ticketTop:       { height: 140, justifyContent: 'center', position: 'relative' },
  ticketTopOverlay:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, zIndex: 1 },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, overflow: 'hidden' },
  statusText:      { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.5, textTransform: 'uppercase' },

  ticketNotchContainer: { position: 'relative', height: 24, marginTop: -12, marginBottom: -12, zIndex: 2 },
  ticketNotch:  { flexDirection: 'row', alignItems: 'center', height: '100%' },
  notchCircle:  { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
  notchLeft:    { marginLeft: -18 },
  notchRight:   { marginRight: -18 },
  notchLine:    { flex: 1, height: 1.5, borderStyle: 'dashed', borderWidth: 1, marginHorizontal: 12 },

  ticketBody:   { padding: 28 },
  eventTitle:   { fontSize: 24, fontFamily: FontFamily.bold, marginBottom: 20, color: colors.text, letterSpacing: -0.5, lineHeight: 30 },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    marginBottom: 24,
  },
  cpidText: { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 0.5 },
  infoGrid:     { gap: 20 },
  infoItem:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoLabel:    { fontSize: 10, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  infoValue:    { fontSize: 15, fontFamily: FontFamily.semibold },
  divider:      { height: 1, marginVertical: 24 },
  detailsRow:   { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailItem:   { alignItems: 'center', flex: 1 },
  detailLabel:  { fontSize: 10, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  detailValue:  { fontSize: 18, fontFamily: FontFamily.bold },

  qrSection:        { alignItems: 'center', gap: 20 },
  qrTitle:          { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 1.5, textTransform: 'uppercase' },
  qrImageContainer: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1 },
  qrImage:          { width: 240, height: 240 },
  scannedOverlay:   { alignItems: 'center', gap: 8, paddingVertical: 20 },
  scannedText:      { fontSize: 20, fontFamily: FontFamily.bold },
  scannedTime:      { fontSize: 14, fontFamily: FontFamily.medium },
  ticketCodeText:   { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: 4, marginTop: 4 },

  walletSection: { marginTop: 32 },
  walletTitle:   { fontSize: 11, fontFamily: FontFamily.bold, marginBottom: 14, letterSpacing: 1.2, textTransform: 'uppercase', paddingLeft: 4 },
  walletButtons: { flexDirection: 'row', gap: 12 },
  walletBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 15 },
  walletBtnTextApple: { fontSize: 14, fontFamily: FontFamily.bold },
  walletBtnTextGoogle: { fontSize: 14, fontFamily: FontFamily.bold },

  actionsSection: { marginTop: 32 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderBottomWidth: 1 },
  actionIcon:     { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText:     { flex: 1, fontSize: 15, fontFamily: FontFamily.semibold },
});
