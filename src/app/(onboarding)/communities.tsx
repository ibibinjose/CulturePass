import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';
import { M3TopAppBar, LuxeButton, LuxeCard, LuxeText } from '@/design-system/ui';
import * as Haptics from 'expo-haptics';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboardingTheme } from '@/hooks/useOnboardingTheme';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';
import {
  OnboardingHero,
  OnboardingPanel,
  OnboardingSearchBar,
  OnboardingPickerGrid,
  OnboardingPickerTile,
  OnboardingFooterPanel,
  OnboardingPrimaryButton,
  OnboardingRestartLink,
  OnboardingSelectionBadge,
  onboardingFormStyles,
} from '@/components/onboarding/OnboardingFlowPrimitives';
import { useAuth } from '@/lib/auth';
import { syncOnboardingProfilePatch } from '@/lib/syncOnboardingProfile';

export default function CommunitiesScreen() {
  const { colors, au } = useOnboardingTheme();
  const m3Colors = useM3Colors();
  const { windowSizeClass } = useLayout();
  const isDesktop = windowSizeClass === 'expanded';

  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { user } = useAuth();
  const { state, setCommunities, skipStep, completeStep } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(state.communities || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggle = useCallback((community: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(community) ? prev.filter((c) => c !== community) : [...prev, community],
    );
  }, []);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return communityGroups;
    return communityGroups
      .map((group) => ({
        ...group,
        members: group.members.filter((m) => m.toLowerCase().includes(q)),
      }))
      .filter((group) => group.members.length > 0);
  }, [searchQuery]);

  const handleNext = useCallback(async () => {
    if (selected.length === 0 || isSaving) return;
    setIsSaving(true);
    setCommunities(selected);
    await syncOnboardingProfilePatch(user?.id, { communities: selected });
    await completeStep('communities').catch(() => {});
    router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo) as string);
    setIsSaving(false);
  }, [selected, setCommunities, redirectTo, user?.id, completeStep, isSaving]);

  const handleSkip = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setCommunities([]);
    await skipStep('communities').catch(() => {});
    router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo) as string);
    setIsSaving(false);
  }, [setCommunities, skipStep, redirectTo, isSaving]);

  return (
    <View style={[styles.container, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Communities"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo))
        }
        variant={isDesktop ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="contain"
          />
        }
      />

      <OnboardingProgressHeader currentStep="communities" redirectTo={redirectTo} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            onboardingFormStyles.scroll,
            isDesktop && onboardingFormStyles.scrollDesktop,
          ]}
        >
          <Animated.View entering={FadeInDown.springify().damping(20).stiffness(120).delay(100)}>
            <LuxeCard
              variant="glass"
              style={[
                onboardingFormStyles.glassCard,
                isDesktop && onboardingFormStyles.glassCardDesktop,
              ]}
            >
              {redirectTo ? <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" /> : null}

              <OnboardingHero
                icon="people"
                title="What communities do you belong to?"
                subtitle="Select groups you identify with — we'll connect you with people and events nearby."
                au={au}
              />

              {selected.length > 0 ? (
                <OnboardingSelectionBadge label={`${selected.length} selected`} au={au} />
              ) : null}

              <OnboardingPanel
                title="Your communities"
                subtitle="Tap every group that fits you."
                au={au}
                colors={colors}
              >
                <OnboardingSearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search communities…"
                  au={au}
                  colors={colors}
                  accessibilityLabel="Search communities"
                />

                {filteredGroups.length === 0 ? (
                  <LuxeText variant="body" style={{ textAlign: 'center', color: au.body, paddingVertical: 16 }}>
                    No communities match your search.
                  </LuxeText>
                ) : (
                  <View style={styles.groups}>
                    {filteredGroups.map((group) => (
                      <View key={group.label} style={styles.groupSection}>
                        <LuxeText variant="title3" style={{ color: au.heading, fontSize: 15, marginBottom: 6 }}>
                          {group.label}
                        </LuxeText>
                        <OnboardingPickerGrid>
                          {group.members.map((community) => (
                            <OnboardingPickerTile
                              key={community}
                              label={community}
                              emoji={communityFlags[community] ?? '🌐'}
                              selected={selected.includes(community)}
                              onPress={() => toggle(community)}
                              au={au}
                              colors={colors}
                            />
                          ))}
                        </OnboardingPickerGrid>
                      </View>
                    ))}
                  </View>
                )}
              </OnboardingPanel>

              <OnboardingFooterPanel au={au} colors={colors}>
                <OnboardingPrimaryButton
                  au={au}
                  rightIcon="arrow-forward"
                  disabled={selected.length === 0 || isSaving}
                  loading={isSaving}
                  onPress={handleNext}
                  style={{ width: '100%' }}
                >
                  {selected.length === 0 ? 'Select at least one' : 'Continue'}
                </OnboardingPrimaryButton>
                <LuxeButton
                  variant="glass"
                  onPress={handleSkip}
                  disabled={isSaving}
                  style={{ borderWidth: 1.5, borderColor: au.cardBorder }}
                >
                  Skip for now
                </LuxeButton>
              </OnboardingFooterPanel>

              <OnboardingRestartLink redirectTo={redirectTo} au={au} />
            </LuxeCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  groups: { gap: 14 },
  groupSection: { gap: 4 },
});