import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Alert, Share, ActivityIndicator } from 'react-native';
import Head from 'expo-router/head';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { log } from '@/lib/logger';
import { goBackOrReplace } from '@/lib/navigation';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/query-client';
import { modulesApi } from '@/modules/api';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { captureEvent } from '@/lib/analytics';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { ButtonTokens, CardTokens } from '@/design-system/tokens/theme';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { openExternalUrl } from '@/lib/openExternalUrl';

import { Perk } from '@/components/perks/types';
import { PERK_TYPE_INFO } from '@/components/perks/constants';
import { PerkHero } from '@/components/perks/PerkHero';
import { PerkAbout } from '@/components/perks/PerkAbout';
import { PerkDetails } from '@/components/perks/PerkDetails';
import { PerkAvailability } from '@/components/perks/PerkAvailability';
import { PerkMembershipCard } from '@/components/perks/PerkMembershipCard';
import { PerkIndigenousCard } from '@/components/perks/PerkIndigenousCard';
import { PerkCouponModal } from '@/components/perks/PerkCouponModal';

export default function PerkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const styles = getStyles(colors);
  const { userId } = useAuth();
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const { data: perk, isLoading } = useQuery({
    queryKey: ['/api/perks', id],
    queryFn: (): Promise<Perk> => modulesApi.perks.get(id) as unknown as Promise<Perk>,
    enabled: !!id,
  });

  useEffect(() => {
    if (!perk) return;
    captureEvent('perk_viewed', {
      perk_id: perk.id,
      perk_type: perk.perkType,
      perk_title: perk.title,
      provider_name: perk.providerName ?? null,
      membership_required: Boolean(perk.isMembershipRequired),
    });
  }, [perk]);

  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const handlePickCover = useCallback(async () => {
    if (!Platform.OS.match(/web/)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        if (perk?.coverUrl) {
          await deleteImage('perks', perk!.id, perk.coverUrl, 'coverUrl');
        }
        await uploadImage(result, 'perks', perk!.id, 'coverUrl');
        queryClient.invalidateQueries({ queryKey: ['/api/perks', id] });
      } catch (err) {
        Alert.alert('Upload Error', String(err));
      }
    }
  }, [perk, id, uploadImage, deleteImage]);

  const canEdit = userId === perk?.createdBy || userId === perk?.providerId || __DEV__;

  const { data: membership } = useQuery<{ tier: string }>({
    queryKey: ['/api/membership', userId],
    enabled: !!userId,
  });

  const redeemMutation = useMutation({
    mutationFn: async (perkId: string) => {
      const res = await apiRequest('POST', `/api/perks/${perkId}/redeem`, { userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/perks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/redemptions'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!perk) return;
      captureEvent('perk_redeemed', {
        perk_id: perk.id,
        perk_type: perk.perkType,
        perk_title: perk.title,
        provider_name: perk.providerName ?? null,
      });
      const code = `CP-${perk.perkType.toUpperCase().replace('_', '')}-${Date.now().toString(36).toUpperCase()}`;
      setCouponCode(code);
      setShowCoupon(true);
    },
    onError: (err: Error) => {
      Alert.alert('Cannot Redeem', err.message);
    },
  });

  if (isLoading || !perk) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { paddingTop: topInset, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="gift-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>{isLoading ? 'Loading...' : 'Perk not found'}</Text>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backLink}>Go Back</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  const typeInfo = PERK_TYPE_INFO[perk.perkType] || PERK_TYPE_INFO.discount_percent;
  const requiredTier = perk.requiredMembershipTier || (perk.isMembershipRequired ? 'plus' : 'free');
  const userTier = membership?.tier || 'free';
  const rank: Record<string, number> = {
    free: 0,
    basic: 1,
    plus: 2,
    elite: 3,
    pro: 4,
    premium: 5,
    vip: 6
  };
  const isTierLocked = requiredTier !== 'free' && (rank[userTier] ?? 0) < (rank[requiredTier] ?? 0);

  const canRedeem = (() => {
    if (isTierLocked) return false;
    if (perk.usageLimit && (perk.usedCount || 0) >= perk.usageLimit) return false;
    return true;
  })();
  const usagePercent = perk.usageLimit ? Math.round(((perk.usedCount || 0) / perk.usageLimit) * 100) : 0;
  const remaining = perk.usageLimit ? perk.usageLimit - (perk.usedCount || 0) : null;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.co/perks/${id}`;
      await Share.share({
        title: `${perk.title} - CulturePass Perk`,
        message: `Check out this perk on CulturePass: ${perk.title}! ${perk.description || ''} ${perk.providerName ? `From ${perk.providerName}.` : ''}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {}
  };

  const handleRedeem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isTierLocked) {
      captureEvent('perk_upgrade_prompted', {
        perk_id: perk.id,
        perk_type: perk.perkType,
        perk_title: perk.title,
        provider_name: perk.providerName ?? null,
      });
      router.push({ pathname: '/membership/upgrade' });
      return;
    }

    if (perk.priceTier && perk.priceTier !== 'free') {
      try {
        if (!functions) { Alert.alert('Checkout Failed', 'Firebase not available.'); return; }
        const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
        const result = await createCheckoutSession({ perkId: perk.id });
        const { url } = result.data as any;

        log.action('payment.checkout_initiated', {
          perkId: perk.id,
          priceTier: perk.priceTier,
        });

        if (url) {
          openExternalUrl(url, { failureTitle: 'Could not open checkout' });
        }
      } catch (err: any) {
        Alert.alert('Checkout Failed', err.message);
      }
    } else {
      redeemMutation.mutate(perk.id);
    }
  };

  const isIndigenous = perk.category === 'indigenous';
  const perkTitle = `${perk.title} | CulturePass Perks`;
  const perkDesc = perk.description || `Exclusive perk from ${perk.providerName ?? 'CulturePass'} — available to CulturePass members.`;
  const perkUrl = `https://culturepass.co/perks/${id}`;

  return (
    <ErrorBoundary>
      <Head>
        <title>{perkTitle}</title>
        <meta name="description" content={perkDesc} />
        <meta property="og:title" content={perkTitle} />
        <meta property="og:description" content={perkDesc} />
        <meta property="og:url" content={perkUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={perkTitle} />
        <meta name="twitter:description" content={perkDesc} />
        <link rel="canonical" href={perkUrl} />
      </Head>
      <View style={styles.container}>
        <View style={{ position: 'relative' }}>
          <PerkHero
            perk={perk}
            topInset={topInset}
            typeInfo={typeInfo}
            isIndigenous={isIndigenous}
            onShare={handleShare}
          />
          {canEdit && (
            <Pressable
              onPress={handlePickCover}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center', paddingTop: topInset }]}
              accessibilityLabel="Change cover image"
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              )}
            </Pressable>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.section}>
            <View style={styles.cpidRow}>
              <Ionicons name="finger-print-outline" size={15} color={colors.primary} />
              <Text style={[styles.cpidText, { color: colors.primary }]}>CPID: {perk.id}</Text>
            </View>
          </View>
          <PerkAbout perk={perk} />
          <PerkDetails perk={perk} typeInfo={typeInfo} />
          <PerkAvailability perk={perk} typeInfo={typeInfo} remaining={remaining} usagePercent={usagePercent} />
          <PerkMembershipCard perk={perk} />
          <PerkIndigenousCard isIndigenous={isIndigenous} />

          {perk.endDate && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <View style={styles.expiryRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.expiryText, { color: colors.text }]}>
                    Valid until {new Date(perk.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <PerkCouponModal showCoupon={showCoupon} couponCode={couponCode} setShowCoupon={setShowCoupon} />

        <View style={[styles.bottomBar, { paddingBottom: bottomInset + 14 }]}>
          <Pressable
            onPress={handleRedeem}
            disabled={(!canRedeem && !isTierLocked) || redeemMutation.isPending}
            style={({ pressed }) => [
              styles.redeemBtn,
              !canRedeem && !isTierLocked && styles.redeemBtnDisabled,
              isTierLocked && { backgroundColor: colors.info + '12', borderColor: colors.info },
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={canRedeem ? 'Redeem perk' : (isTierLocked ? `Upgrade to ${requiredTier.toUpperCase()}` : 'Fully Redeemed')}
          >
            <Ionicons
              name={canRedeem ? 'gift' : (isTierLocked ? 'star' : 'lock-closed')}
              size={20}
              color={canRedeem ? colors.textInverse : (isTierLocked ? colors.info : colors.textSecondary)}
            />
            <Text style={[
              styles.redeemBtnText,
              !canRedeem && !isTierLocked && styles.redeemBtnTextDisabled,
              isTierLocked && { color: colors.info },
              canRedeem && { color: colors.textInverse },
            ]}>
              {redeemMutation.isPending ? 'Redeeming...' : !canRedeem ? (isTierLocked ? `Upgrade to ${requiredTier.toUpperCase()}` : 'Fully Redeemed') : 'Redeem Now'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  loadingText:        { fontSize: 16, fontFamily: 'Poppins_500Medium', marginTop: 12 },
  backLink:           { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.primary, marginTop: 12 },
  section:            { paddingHorizontal: CardTokens.padding + 4, paddingVertical: CardTokens.padding },
  divider:            { height: 1, backgroundColor: colors.border, marginHorizontal: CardTokens.padding + 4 },
  expiryRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expiryText:         { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  cpidRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '33', backgroundColor: colors.primary + '14' },
  cpidText:           { fontSize: 12, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
  bottomBar:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, paddingTop: CardTokens.padding, paddingHorizontal: CardTokens.padding + 4, borderTopWidth: 1, borderTopColor: colors.border },
  redeemBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: ButtonTokens.radiusPill, paddingVertical: CardTokens.padding },
  redeemBtnDisabled:  { backgroundColor: colors.surface },
  redeemBtnText:      { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  redeemBtnTextDisabled: { color: colors.textTertiary },
});
