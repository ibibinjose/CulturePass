import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { router, usePathname } from 'expo-router';
import { queryClient } from '@/lib/query-client';
import { type MembershipSummary, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { HapticManager } from '@/lib/haptics';
import { isSafeExternalUrl } from '@/lib/openExternalUrl';

import { membershipRepository } from '@/repositories/MembershipRepository';
import { purchaseMembershipUseCase } from '@/use-cases/PurchaseMembershipUseCase';
import { cancelMembershipUseCase } from '@/use-cases/CancelMembershipUseCase';
import { captureEvent } from '@/lib/analytics';

export function useMembershipUpgrade() {
  const pathname = usePathname();
  const { userId, isAuthenticated, user } = useAuth();
  const billingCountry = user?.country;
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setLoadingSafe = useCallback((value: boolean) => {
    if (isMountedRef.current) setLoading(value);
  }, []);

  const { data: membership, isLoading: isMembershipLoading } = useQuery<MembershipSummary>({
    queryKey: ['membership', userId],
    queryFn: () => membershipRepository.getMembership(userId!),
    enabled: !!userId,
  });

  const { data: memberCountData } = useQuery({
    queryKey: ['membership-member-count'],
    queryFn: () => membershipRepository.getMemberCount(),
  });

  const { data: pricingData, isLoading: isPricingLoading } = useQuery({
    queryKey: ['pricing-membership', billingCountry ?? 'default'],
    queryFn: () => api.pricing.membership(billingCountry),
    staleTime: 60_000,
  });

  const monthlyPlan = useMemo(
    () => pricingData?.plans.find((p) => p.billingPeriod === 'monthly'),
    [pricingData],
  );
  const yearlyPlan = useMemo(
    () => pricingData?.plans.find((p) => p.billingPeriod === 'yearly'),
    [pricingData],
  );
  const activePlan = billingPeriod === 'yearly' ? yearlyPlan : monthlyPlan;

  const isPlus = membership?.tier === 'plus' && membership?.status === 'active';
  const memberCount = memberCountData?.count ?? 0;
  const price = activePlan?.amountFormatted ?? (billingPeriod === 'yearly' ? '$69' : '$7.99');
  const perMonth =
    billingPeriod === 'yearly'
      ? (yearlyPlan?.perMonthFormatted ?? yearlyPlan?.amountFormatted ?? '$5.75')
      : (monthlyPlan?.amountFormatted ?? '$7.99');
  const yearlySavingsFormatted = yearlyPlan?.savingsFormatted;
  const pricingMarket = pricingData?.market;
  const pricingCurrency = pricingData?.currency;

  const executeSubscribe = useCallback(async () => {
    if (!userId) {
      Alert.alert('Login required', 'Please sign in to activate CulturePass+.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname)) },
      ]);
      return;
    }
    setLoadingSafe(true);
    captureEvent('membership_upgrade_started', {
      billing_period: billingPeriod,
      pricing_market: pricingMarket,
      pricing_currency: pricingCurrency,
    });
    try {
      await HapticManager.medium();
      const result = await purchaseMembershipUseCase.execute(
        billingPeriod,
        appliedPromoCode,
        billingCountry,
      );

      if (result.status === 'already_active') {
        await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
        Alert.alert('Already Active', 'Your CulturePass+ membership is already active.');
        return;
      }

      if (result.status === 'checkout_required') {
        if (!isSafeExternalUrl(result.url)) {
          Alert.alert('Error', 'Checkout link is not supported.');
          return;
        }
        await WebBrowser.openBrowserAsync(result.url);
        await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
        await queryClient.invalidateQueries({ queryKey: ['membership-member-count'] });

        let retries = 0;
        const pollForUpdate = async (): Promise<void> => {
          if (retries >= 8) return;
          try {
            const checkData = await membershipRepository.getMembership(userId);
            if (checkData?.tier === 'plus' && checkData?.status === 'active') {
              await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
              await HapticManager.success();
              Alert.alert('Welcome to CulturePass+!', 'Your membership is now active. Enjoy early access, cashback rewards, and exclusive perks!');
              return;
            }
          } catch {}
          await new Promise(r => setTimeout(r, 2000));
          retries++;
          return pollForUpdate();
        };
        await pollForUpdate();
      } else if (result.status === 'direct_redeemed') {
        await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
        await HapticManager.success();
        Alert.alert('Welcome to CulturePass+!', 'Your promo code was redeemed directly! Enjoy all benefits. 🎉');
      } else if (result.status === 'dev_mode_success') {
        await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
        await HapticManager.success();
        Alert.alert('Dev Mode', 'Membership upgraded to Plus (dev mode — no Stripe charge).');
      } else if (result.status === 'error') {
        Alert.alert('Error', result.message);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start subscription';
      Alert.alert('Error', msg);
    } finally {
      setLoadingSafe(false);
    }
  }, [
    userId,
    billingPeriod,
    pathname,
    setLoadingSafe,
    appliedPromoCode,
    billingCountry,
    pricingMarket,
    pricingCurrency,
  ]);

  const executeCancel = useCallback(async () => {
    if (!userId) return;
    Alert.alert(
      'Cancel Membership',
      'Are you sure you want to cancel your CulturePass+ membership? Your subscription will be cancelled immediately and you will lose access to exclusive perks and cashback.',
      [
        { text: 'Keep Membership', style: 'cancel' },
        {
          text: 'Cancel Membership',
          style: 'destructive',
          onPress: async () => {
            setLoadingSafe(true);
            try {
              const result = await cancelMembershipUseCase.execute();
              if (result.status === 'success') {
                await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
                await queryClient.invalidateQueries({ queryKey: ['membership-member-count'] });

                const currentMembership = queryClient.getQueryData<MembershipSummary>(['membership', userId]);
                queryClient.setQueryData(['membership', userId], {
                  ...currentMembership,
                  tier: 'free', tierLabel: 'Free', status: 'inactive', expiresAt: null,
                  cashbackRate: 0, cashbackMultiplier: 1, earlyAccessHours: 0,
                  eventsAttended: currentMembership?.eventsAttended ?? 0,
                } satisfies MembershipSummary);

                captureEvent('membership_cancelled', {
                  previous_billing_period: billingPeriod,
                });

                await HapticManager.success();
                Alert.alert('Membership Cancelled', 'Your CulturePass+ membership has been cancelled. You can re-subscribe anytime.');
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Failed to cancel';
              Alert.alert('Error', msg);
            } finally {
              setLoadingSafe(false);
            }
          },
        },
      ]
    );
  }, [userId, billingPeriod, setLoadingSafe]);

  const handleBillingPeriodChange = useCallback((period: 'monthly' | 'yearly') => {
    if (period !== billingPeriod) {
      captureEvent('membership_billing_period_changed', {
        from: billingPeriod,
        to: period,
      });
    }
    setBillingPeriod(period);
  }, [billingPeriod]);

  return {
    isAuthenticated,
    isMembershipLoading,
    isPricingLoading,
    membership,
    isPlus,
    memberCount,
    billingPeriod,
    setBillingPeriod: handleBillingPeriodChange,
    price,
    perMonth,
    yearlySavingsFormatted,
    pricingMarket,
    pricingCurrency,
    loading,
    executeSubscribe,
    executeCancel,
    appliedPromoCode,
    setAppliedPromoCode,
  };
}