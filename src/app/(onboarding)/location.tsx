import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  type DimensionValue,
} from 'react-native';
import { Image } from 'expo-image';
import { router , useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInRight, FadeInLeft, FadeInDown } from 'react-native-reanimated';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboardingTheme } from '@/hooks/useOnboardingTheme';
import { luxeDark, luxeLight } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { LuxeFilterChip } from '@/design-system/ui/LuxeFilterChip';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { australianPostcodes } from '@shared/location/australian-postcodes';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';

// Import missing hooks and utils
import { useAuth } from '@/lib/auth';
import { useLocations } from '@/hooks/useLocations';
import { useNearestMarketplaceLocation } from '@/hooks/useNearestMarketplaceLocation';
import { useDetectCountry } from '@/hooks/useDetectCountry';
import { useNearestCouncil } from '@/hooks/useNearestCouncil';
import { sanitizeInternalRedirect, routeWithRedirect } from '@/lib/routes';
import { getCountryFlag , 
  getCountryForCity, 
  getRegionsForCountry,
  listMarketplaceCountries, 
  resolveCountryPickerPin 
} from '@/lib/marketplaceLocation';
import { api } from '@/lib/api';
import { syncUserMarketplaceLocation } from '@/lib/syncMarketplaceLocation';
import { CountrySelectList } from '@/components/location/CountrySelectList';
import { showUserAlert } from '@/lib/showUserAlert';
import { OnboardingRestartLink } from '@/components/onboarding/OnboardingFlowPrimitives';

// Define types directly since they may not be properly exported
type AustralianState = {
  code: string;
  name: string;
  emoji?: string;
};

// Helper functions
export function getAustralianStates(): AustralianState[] {
  const statesSet = new Set(australianPostcodes.map((pc: any) => pc.state_code));
  return Array.from(statesSet).map(code => {
    const stateName = australianPostcodes.find((pc: any) => pc.state_code === code)?.state_name || code;
    return {
      code,
      name: stateName,
      emoji: '🇦🇺'
    };
  });
}

export function getCitiesForState(stateCode: string): string[] {
  const filteredPostcodes = australianPostcodes.filter((pc: any) => pc.state_code === stateCode);
  const uniqueCities = Array.from(new Set(filteredPostcodes.map((pc: any) => pc.place_name)));
  return uniqueCities.sort();
}

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type LocStep = 'country' | 'region' | 'city';

const STEPS: LocStep[] = ['country', 'region', 'city'];
const STEP_LABELS = ['Country', 'State', 'City'];

const STEP_ICON: Record<LocStep, keyof typeof Ionicons.glyphMap> = {
  country: 'earth',
  region: 'compass',
  city: 'location',
};

const STEP_TITLE: Record<LocStep, (country?: string) => string> = {
  country: () => 'Where are you based?',
  region: (c) => (c === 'Australia' ? 'Your home state' : 'Your region'),
  city: () => 'Choose your city',
};

const STEP_SUBTITLE: Record<LocStep, string> = {
  country: 'CulturePass shows events, communities and deals tailored to your location.',
  region: "We'll prioritize cultural events and communities near you.",
  city: "Pick your city and we'll show what's happening nearby.",
};

// Reliable fallback list for Australian states (used when dynamic data fails)
const australianStatesFallback: { code: string; name: string; emoji: string; cities?: number }[] = [
  { code: 'NSW', name: 'New South Wales', emoji: '🏙️', cities: 35 },
  { code: 'VIC', name: 'Victoria', emoji: '🎭', cities: 27 },
  { code: 'QLD', name: 'Queensland', emoji: '🌞', cities: 27 },
  { code: 'WA', name: 'Western Australia', emoji: '🌊', cities: 26 },
  { code: 'SA', name: 'South Australia', emoji: '🍷', cities: 21 },
  { code: 'TAS', name: 'Tasmania', emoji: '🏔️', cities: 15 },
  { code: 'ACT', name: 'Australian Capital Territory', emoji: '🏛️', cities: 10 },
  { code: 'NT', name: 'Northern Territory', emoji: '🦘', cities: 13 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocationScreen() {
  const colors = useColors();
  const { au, isDark } = useOnboardingTheme();
  const luxe = isDark ? luxeDark : luxeLight;
  const m3Colors = useM3Colors();
  const { isDesktop, windowSizeClass, hPad = 16 } = useLayout();
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);
  const isExpanded = windowSizeClass === 'expanded';

  const { user } = useAuth();
  const { state, setCountry, setCity, setCouncil } = useOnboarding();
  const { states, getStateForCity, isLoading: locationsLoading } = useLocations();

  // City detection — marketplace countries (region step)
  const { detect: detectCity, status: cityDetectStatus } = useNearestMarketplaceLocation();
  const { detect: detectCouncil, council: detectedCouncil, distanceKm, matchMethod, confidence, status: councilStatus, reset: resetCouncil } = useNearestCouncil();
  const isDetectingCity = cityDetectStatus === 'requesting';

  // Country detection (country step)
  const {
    detect: detectCountry,
    country: gpsCountry,
    status: countryDetectStatus,
    reset: resetGpsCountry,
  } = useDetectCountry();
  const isDetectingCountry = countryDetectStatus === 'requesting';

  const [step, setStep] = useState<LocStep>('country');
  const [stepDir, setStepDir] = useState<'forward' | 'back'>('forward');
  const [pendingCountry, setPendingCountry] = useState('');
  const [pendingState, setPendingState] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const stepIndex = STEPS.indexOf(step);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const countries = useMemo(() => listMarketplaceCountries(), []);

  /** Pin list order: profile → city → GPS → locale. Skip list pin when only the GPS chip highlights that country. */
  const preferCountryFirst = useMemo(() => {
    const pin = resolveCountryPickerPin({
      savedCountry: state.country,
      savedCity: state.city,
      suggestedGpsCountry: gpsCountry,
    });
    if (!pin) return undefined;
    if (!state.country?.trim() && gpsCountry && pin === gpsCountry) return undefined;
    return pin;
  }, [gpsCountry, state.country, state.city]);

  const regions = useMemo(
    () => (pendingCountry ? getRegionsForCountry(pendingCountry, states) : []),
    [pendingCountry, states],
  );

  // Pre-fill if user already has a location
  useEffect(() => {
    if (!state.city) return;
    const c = state.country || getCountryForCity(state.city) || 'Australia';
    const stateCode = getStateForCity(state.city);
    if (stateCode) {
      setPendingCountry(c);
      setPendingState(stateCode);
      setStep('city');
    }
  }, [state.city, state.country, getStateForCity]);

  // Slice 2: Declarative auto-trigger for council (LGA) when city is successfully set for Australia.
  // This replaces the previous fragile setTimeout hack in handleDetectCity (which was a workaround for JSI crashes).
  // Runs only when entering the city step with AU data and no council detected yet.
  useEffect(() => {
    const shouldAutoDetectCouncil =
      step === 'city' &&
      pendingCountry === 'Australia' &&
      !!state.city &&
      !detectedCouncil &&
      councilStatus === 'idle';

    if (shouldAutoDetectCouncil) {
      const t = setTimeout(() => {
        void detectCouncil({
          city: state.city,
          state: pendingState || getStateForCity(state.city) || undefined,
          country: 'Australia',
        });
      }, 0);

      return () => clearTimeout(t);
    }
  }, [step, pendingCountry, state.city, pendingState, detectedCouncil, councilStatus, detectCouncil, getStateForCity]);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const goToStep = (next: LocStep, dir: 'forward' | 'back') => {
    setStepDir(dir);
    setStep(next);
  };

  const goBackWithinFlow = () => {
    if (step === 'city') {
      setCitySearch('');
      resetCouncil(); // Clear any auto-detected council when leaving the city step (prevents stale data on back/forward)
      if (pendingCountry === 'Australia') {
        goToStep('region', 'back');
      } else {
        goToStep('country', 'back');
        setPendingState('');
        setPendingCountry('');
      }
      return;
    }
    if (step === 'region') {
      goToStep('country', 'back');
      setPendingState('');
      setPendingCountry('');
    }
  };

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  const selectMarketplaceCountry = (countryName: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    resetGpsCountry();
    setPendingCountry(countryName);
    setCitySearch('');
    // If switching away from Australia, clear any council data (AU-specific feature)
    if (countryName !== 'Australia') {
      resetCouncil();
    }
    const regs = getRegionsForCountry(countryName, states);
    if (regs.length === 1) {
      setPendingState(regs[0].code);
      goToStep('city', 'forward');
    } else {
      setPendingState('');
      goToStep('region', 'forward');
    }
  };

  const selectRegion = (stateCode: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPendingState(stateCode);
    setCitySearch('');
    goToStep('city', 'forward');
  };

  const selectCity = (city: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const c = pendingCountry || state.country || 'Australia';
    setCountry(c);
    setCity(city);
    void syncUserMarketplaceLocation(user?.id, c, city);

    // For AU: reset any previous council so the declarative auto-detect effect can re-trigger for the new city
    if (c === 'Australia') {
      resetCouncil();
    }
  };

  // ---------------------------------------------------------------------------
  // GPS handlers
  // ---------------------------------------------------------------------------

  const handleDetectCountry = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await detectCountry();
    if (result.country) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (result.status === 'denied') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to detect your country, or select it manually below.',
        );
      } else if (result.status === 'unavailable') {
        Alert.alert(
          'Location Services Off',
          'Turn on location services to auto-detect your country, or select it manually.',
        );
      }
    }
  };

  const handleDetectCity = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await detectCity();
    if (r) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountry(r.country);
      setCity(r.city);
      setPendingCountry(r.country);
      void syncUserMarketplaceLocation(user?.id, r.country, r.city);
      const stateCode = getStateForCity(r.city);
      if (stateCode) setPendingState(stateCode);
      goToStep('city', 'forward');

      // Note: Council auto-detection for AU is now handled declaratively via useEffect below (removes fragile setTimeout hack)
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (cityDetectStatus === 'denied') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to detect your city automatically, or select it manually below.',
        );
      } else if (cityDetectStatus === 'unavailable') {
        Alert.alert(
          'Location Services Off',
          'Turn on location services to auto-detect your city, or select it manually below.',
        );
      } else if (cityDetectStatus === 'unsupported_country') {
        Alert.alert(
          'Location Outside Marketplace',
          'Your GPS position is not in a country we currently support. Please pick your country and city from the lists.',
        );
      } else {
        Alert.alert('Could Not Detect Location', 'We could not match your position to a city in our list. Please choose your city manually.');
      }
    }
  };

  const councilDetectContext = useMemo(
    () => ({
      city: state.city || undefined,
      state: pendingState || getStateForCity(state.city) || undefined,
      country: 'Australia',
    }),
    [state.city, pendingState, getStateForCity],
  );

  const handleDetectCouncil = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const outcome = await detectCouncil(councilDetectContext);
    if (outcome?.ok) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const failStatus = outcome && !outcome.ok ? outcome.status : 'error';
    if (failStatus === 'denied') {
      showUserAlert(
        'Location Permission Required',
        'Please allow location access to detect your local council, or continue without it.',
      );
    } else if (failStatus === 'unavailable') {
      showUserAlert(
        'Location Services Off',
        'Turn on location services to detect your council automatically.',
      );
    } else {
      showUserAlert(
        'Could Not Detect Council',
        state.city
          ? `We could not match your position to an LGA near ${state.city}. Try again or continue without selecting a council.`
          : 'We could not match your position to a local council. Select your city first, then try again.',
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Finish
  // ---------------------------------------------------------------------------

  const handleNext = () => {
    if (state.country && state.city) {
      void syncUserMarketplaceLocation(user?.id, state.country, state.city);
      router.replace(routeWithRedirect('/(onboarding)/communities', redirectTo) as string);
      return;
    }
    Alert.alert('Select Location', 'Please choose your state and city to continue.');
  };

  // ---------------------------------------------------------------------------
  // Derived UI values
  // ---------------------------------------------------------------------------

  const pendingRegionMeta = useMemo(
    () => regions.find((r) => r.code === pendingState),
    [regions, pendingState],
  );

  const allCitiesForState = useMemo(() => pendingRegionMeta?.cities ?? [], [pendingRegionMeta]);

  const citiesToShow = useMemo(() => {
    if (!citySearch.trim()) return allCitiesForState;
    const q = citySearch.trim().toLowerCase();
    return allCitiesForState.filter((c) => c.toLowerCase().includes(q));
  }, [allCitiesForState, citySearch]);

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; active: boolean; done: boolean }[] = [
      {
        label: pendingCountry || 'Country',
        active: step === 'country',
        done: step !== 'country' && !!pendingCountry,
      },
    ];
    if (step !== 'country') {
      items.push({
        label: pendingRegionMeta?.name || 'State',
        active: step === 'region',
        done: step === 'city' && !!pendingState,
      });
    }
    if (step === 'city') {
      items.push({
        label: state.city || 'City',
        active: step === 'city',
        done: false,
      });
    }
    return items;
  }, [step, pendingCountry, pendingRegionMeta, pendingState, state.city]);

  const stepEntering =
    stepDir === 'forward'
      ? FadeInRight.duration(260).springify().damping(22).stiffness(130)
      : FadeInLeft.duration(260).springify().damping(22).stiffness(130);

  const enter = (delay: number) => FadeInDown.delay(delay).springify().damping(20).stiffness(120);

  // ---------------------------------------------------------------------------
  // GPS country suggestion slot (shown at top of country list)
  // Plain render — no useMemo so onPress always has a fresh handler reference.
  // ---------------------------------------------------------------------------

  const renderGpsSuggestionSlot = () => {
    if (gpsCountry) {
      return (
      <LuxeCard
        variant="filled"
        onPress={() => selectMarketplaceCountry(gpsCountry)}
        style={[
          s.gpsSuggestCard,
          {
            backgroundColor: au.blue,
            marginBottom: 12,
          },
        ]}
      ><View style={[s.gpsSuggestIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="navigate-circle" size={20} color="#FFFFFF" />
        </View>
        <View style={s.gpsSuggestTextWrap}>
          <LuxeText variant="badgeCaps" style={{ color: au.red }}>SUGGESTED FOR YOU</LuxeText>
          <LuxeText variant="title3" style={{ color: '#FFFFFF' }}>
            {getCountryFlag(gpsCountry)}{'  '}{gpsCountry}
          </LuxeText>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" /></LuxeCard>
      );
    }

    return (
      <LuxeButton
        variant="filled"
        gradientColors={au.gradient}
        onPress={handleDetectCountry}
        disabled={isDetectingCountry}
        loading={isDetectingCountry}
        leftIcon="navigate-circle"
        style={{ marginBottom: 12, height: 46, borderRadius: 12 }}
      >
        Detect my country
      </LuxeButton>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={[s.container, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Location"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        variant={isExpanded ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <OnboardingProgressHeader currentStep="location" redirectTo={redirectTo} />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enter(40)} style={[s.formContainer, isDesktop && s.formContainerDesktop]}>
          <LuxeCard variant="glass" style={s.formContent}>{/* Breadcrumb — shown after country is chosen */}
            {step !== 'country' && (
              <View style={s.breadcrumbRow}>
                {breadcrumbItems.map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <Ionicons name="chevron-forward" size={12} color={luxe.textSecondary} />
                    )}
                    <LuxeFilterChip
                      label={item.label}
                      onPress={() => {}}
                      selected={item.active}
                      compact
                      activeBgColor={au.blueContainer}
                      activeTextColor={au.selectedText}
                    />
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Desktop step progress dots */}
            {isDesktop && (
              <Animated.View entering={enter(0)} style={s.desktopStepRow}>
                {STEPS.map((st, i) => {
                  const isDone = i < stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <React.Fragment key={st}>
                      <View style={s.desktopStepItem}>
                        <View
                          style={[
                            s.desktopStepDot,
                            isDone
                              ? { backgroundColor: au.blue, borderColor: au.blue }
                              : isActive
                                ? {
                                    borderColor: au.red,
                                    borderWidth: 2.5,
                                    backgroundColor: colors.surfaceSecondary,
                                  }
                                : {
                                    borderColor: colors.borderLight,
                                    backgroundColor: colors.surfaceSecondary,
                                  },
                          ]}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={10} color={colors.surface} />
                          ) : (
                            <View
                              style={[
                                s.desktopDotInner,
                                isActive
                                  ? { backgroundColor: au.red }
                                  : { backgroundColor: colors.textTertiary },
                              ]}
                            />
                          )}
                        </View>
                        <Text style={[s.desktopStepLabel, { color: isActive ? au.heading : colors.textTertiary }]}>
                          {STEP_LABELS[i]}
                        </Text>
                      </View>
                      {i < STEPS.length - 1 && (
                        <View
                          style={[
                            s.desktopStepLine,
                            { backgroundColor: isDone ? au.blue : colors.borderLight },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </Animated.View>
            )}

            {redirectTo ? (
              <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" />
            ) : null}

            {/* Step icon + title */}
            <View style={s.headerBlock}>
              <View style={[s.iconWrapper, { backgroundColor: au.blueContainer, borderWidth: 2, borderColor: au.red }]}>
                <Animated.View key={step} entering={FadeIn.duration(200)}>
                  <Ionicons name={STEP_ICON[step]} size={26} color={au.onBlueSurface} />
                </Animated.View>
              </View>
              {step !== 'city' ? (
                <>
                  <LuxeText variant="display" style={[s.title, { color: au.heading }]}>
                    {STEP_TITLE[step](pendingCountry)}
                  </LuxeText>
                  <View style={s.titleAccentRow}>
                    <View style={[s.titleAccentBar, { backgroundColor: au.blue }]} />
                    <View style={[s.titleAccentBar, { backgroundColor: au.red }]} />
                  </View>
                  <LuxeText variant="body" style={[s.subtitle, { color: au.body }]}>
                    {STEP_SUBTITLE[step]}
                  </LuxeText>
                </>
              ) : null}
            </View>

            {/* Step content */}
            <Animated.View key={step} entering={stepEntering}>

              {/* ── Country Step ── */}
              {step === 'country' && (
                <CountrySelectList
                  countries={countries}
                  selectedName={state.country || undefined}
                  preferCountryFirst={preferCountryFirst}
                  onSelect={selectMarketplaceCountry}
                  variant="onboarding"
                  colors={colors}
                  showFooterHint={false}
                  leadingSlot={renderGpsSuggestionSlot()}
                />
              )}

              {/* ── Region Step ── */}
              {step === 'region' && (
                <View>
                  {/* GPS city detect — AU only */}
                  {pendingCountry === 'Australia' && (
                    <LuxeButton
                        variant="filled"
                        gradientColors={au.gradient}
                        onPress={handleDetectCity}
                        disabled={isDetectingCity}
                        loading={isDetectingCity}
                        leftIcon="navigate-circle"
                        style={{ height: 46, borderRadius: 12, marginBottom: 10 }}
                    >
                        Use my location
                    </LuxeButton>
                  )}

                  {pendingCountry === 'Australia' && locationsLoading && (
                    <ActivityIndicator size="large" color={au.blue} style={{ paddingVertical: 20 }} />
                  )}

                  {/* State picker — bordered panel with header + list */}
                  {pendingCountry === 'Australia' && !locationsLoading && (
                    <View
                      style={[
                        s.statePickerPanel,
                        {
                          borderColor: au.panelBorder,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    >
                      <View style={s.statePickerAccent}>
                        <View style={[s.statePickerAccentBar, { backgroundColor: au.blue }]} />
                        <View style={[s.statePickerAccentBar, { backgroundColor: au.red }]} />
                      </View>
                      <View style={s.statePickerHeader}>
                        <LuxeText
                          variant="title3"
                          style={{
                            color: au.heading,
                            textAlign: 'center',
                            fontSize: 20,
                            fontFamily: FontFamily.semibold,
                          }}
                        >
                          Your home state
                        </LuxeText>
                        <LuxeText
                          variant="caption"
                          style={{
                            color: au.body,
                            textAlign: 'center',
                            marginTop: 4,
                            fontSize: 15,
                            lineHeight: 20,
                          }}
                        >
                          We&apos;ll prioritize cultural events and communities near you.
                        </LuxeText>
                      </View>
                      <View
                        style={[
                          s.statePickerDivider,
                          { backgroundColor: au.panelBorder },
                        ]}
                      />
                      <View style={s.stateList}>
                      {(() => {
                        const auRegions = (regions || []).filter((r: any) =>
                          ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].includes(r.code)
                        );
                        const rawStates = auRegions.length > 0 ? auRegions : australianStatesFallback;

                        // Normalize once — NEVER render .cities array (prevents "SydneyParramatta..." concatenation)
                        const statesToShow = rawStates.map((st: any) => {
                          const count = Array.isArray(st.cities)
                            ? st.cities.length
                            : (typeof st.cities === 'number' ? st.cities : 0);
                          const safeCount = count > 0 ? count : (australianStatesFallback.find(f => f.code === st.code)?.cities ?? 0);
                          return {
                            code: st.code,
                            name: st.name,
                            emoji: st.emoji || '🇦🇺',
                            cityCount: safeCount,
                          };
                        });

                        return statesToShow.map((st) => {
                          const isSelected = st.code === pendingState;
                          return (
                            <View key={st.code} style={s.pickerGridItem}>
                              <LuxeCard
                                variant="default"
                                onPress={() => selectRegion(st.code)}
                                style={[
                                  s.pickerCard,
                                  {
                                    borderWidth: 1.5,
                                    borderColor: isSelected ? au.blue : au.cardBorder,
                                    backgroundColor: isSelected ? au.selectedBg : colors.surfaceElevated,
                                  },
                                ]}
                              >
                                <View style={s.pickerCardInner}>
                                  {isSelected ? (
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={16}
                                      color={au.red}
                                      style={s.pickerCardBadge}
                                    />
                                  ) : null}
                                  <Text style={s.pickerEmoji}>{st.emoji}</Text>
                                  <LuxeText
                                    variant="caption"
                                    style={{
                                      color: isSelected ? au.selectedText : au.heading,
                                      fontFamily: FontFamily.semibold,
                                      fontSize: 16,
                                      lineHeight: 20,
                                      textAlign: 'center',
                                    }}
                                    numberOfLines={2}
                                  >
                                    {st.name}
                                  </LuxeText>
                                  <LuxeText
                                    variant="caption"
                                    style={{
                                      color: isSelected ? au.onBlueMuted : au.body,
                                      fontSize: 13,
                                      textAlign: 'center',
                                    }}
                                  >
                                    {st.cityCount} cities
                                  </LuxeText>
                                </View>
                              </LuxeCard>
                            </View>
                          );
                        });
                      })()}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* ── City Step ── */}
              {step === 'city' && (
                <View
                  style={[
                    s.statePickerPanel,
                    {
                      borderColor: au.panelBorder,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <View style={s.statePickerAccent}>
                    <View style={[s.statePickerAccentBar, { backgroundColor: au.blue }]} />
                    <View style={[s.statePickerAccentBar, { backgroundColor: au.red }]} />
                  </View>
                  <View style={s.statePickerHeader}>
                    <LuxeText
                      variant="title3"
                      style={{
                        color: au.heading,
                        textAlign: 'center',
                        fontSize: 20,
                        fontFamily: FontFamily.semibold,
                      }}
                    >
                      Choose your city
                    </LuxeText>
                    <LuxeText
                      variant="caption"
                      style={{
                        color: au.body,
                        textAlign: 'center',
                        marginTop: 4,
                        fontSize: 15,
                        lineHeight: 20,
                      }}
                    >
                      Pick your city and we&apos;ll show what&apos;s happening nearby.
                    </LuxeText>
                  </View>
                  <View
                    style={[
                      s.statePickerDivider,
                      { backgroundColor: au.panelBorder },
                    ]}
                  />
                  <View style={s.cityPickerBody}>
                    <View
                      style={[
                        s.searchBar,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderWidth: 1.5,
                          borderColor: au.cardBorder,
                          height: 44,
                          borderRadius: 12,
                          marginBottom: 8,
                        },
                      ]}
                    >
                      <Ionicons name="search" size={18} color={au.body} />
                      <TextInput
                        style={[s.searchInput, { color: au.heading, fontSize: 17, marginLeft: 8 }]}
                        placeholder={`Search ${allCitiesForState.length} cities…`}
                        placeholderTextColor={au.bodyMuted}
                        value={citySearch}
                        onChangeText={setCitySearch}
                        autoCorrect={false}
                        autoCapitalize="words"
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                      />
                      {citySearch.length > 0 && Platform.OS !== 'ios' && (
                        <Pressable onPress={() => setCitySearch('')} hitSlop={8}>
                          <Ionicons name="close" size={18} color={au.body} />
                        </Pressable>
                      )}
                    </View>

                    {citiesToShow.length === 0 ? (
                      <LuxeCard
                        variant="default"
                        style={[
                          s.noResults,
                          {
                            borderWidth: 1.5,
                            borderColor: au.cardBorder,
                          },
                        ]}
                      >
                        <Ionicons name="search-outline" size={48} color={au.bodyMuted} />
                        <LuxeText variant="title3" style={{ color: au.heading }}>
                          No cities match
                        </LuxeText>
                        <LuxeButton variant="glass" size="sm" onPress={() => setCitySearch('')}>
                          Clear search
                        </LuxeButton>
                      </LuxeCard>
                    ) : (
                      <View style={s.pickerGrid}>
                        {citiesToShow.map((city) => {
                          const isActive = state.city === city;
                          return (
                            <View key={city} style={s.pickerGridItem}>
                              <LuxeCard
                                variant="default"
                                onPress={() => selectCity(city)}
                                style={[
                                  s.pickerCard,
                                  {
                                    borderWidth: 1.5,
                                    borderColor: isActive ? au.blue : au.cardBorder,
                                    backgroundColor: isActive ? au.selectedBg : colors.surfaceElevated,
                                  },
                                ]}
                              >
                                <View style={s.pickerCardInnerCompact}>
                                  <Ionicons
                                    name={isActive ? 'checkmark-circle' : 'location-outline'}
                                    size={14}
                                    color={isActive ? au.red : au.blue}
                                  />
                                  <LuxeText
                                    variant="caption"
                                    style={{
                                      color: isActive ? au.selectedText : au.heading,
                                      fontFamily: FontFamily.semibold,
                                      fontSize: 16,
                                      lineHeight: 20,
                                      textAlign: 'center',
                                    }}
                                    numberOfLines={2}
                                  >
                                    {city}
                                  </LuxeText>
                                </View>
                              </LuxeCard>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Back-within-flow link — country/region only (city step uses footer panel) */}
            {step !== 'country' && step !== 'city' && (
              <View style={s.backLinkRow}>
                <LuxeButton
                  variant="glass"
                  size="sm"
                  onPress={goBackWithinFlow}
                  leftIcon="arrow-back"
                >
                    Back
                </LuxeButton>
              </View>
            )}

            {step !== 'city' ? <View style={s.spacer} /> : null}

            {/* Council / LGA Detection — Slice 2 (polished) — AU only */}
            {!!state.city && (pendingCountry === 'Australia' || state.country === 'Australia') && (
              <LuxeCard variant="default" style={{ marginBottom: 10, padding: 12 }}><View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <LuxeText variant="title3" style={{ color: luxe.text, flex: 1, fontSize: 17 }}>
                    Local Council (LGA)
                  </LuxeText>
                  {!!detectedCouncil && !!confidence && (
                    <LuxeText variant="badgeCaps" style={{ color: confidence === 'strong' ? au.red : luxe.textSecondary }}>
                      {confidence.toUpperCase()}
                    </LuxeText>
                  )}
                </View>

                <LuxeText variant="body" style={{ color: luxe.textSecondary, marginBottom: 10, fontSize: 15, lineHeight: 20 }}>
                  Get more tailored events and communities near you.
                </LuxeText>

                {councilStatus === 'requesting' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={au.blue} />
                    <LuxeText variant="body" style={{ color: luxe.textSecondary }}>Detecting your council…</LuxeText>
                  </View>
                ) : !detectedCouncil ? (
                  <View style={{ gap: 10 }}>
                    <LuxeButton
                      variant="filled"
                      gradientColors={au.gradient}
                      onPress={handleDetectCouncil}
                      leftIcon="navigate-circle"
                      style={{ height: 46 }}
                    >
                      Detect my local council
                    </LuxeButton>
                    {councilStatus === 'error' ? (
                      <LuxeText variant="caption" style={{ color: au.red, textAlign: 'center' }}>
                        No council matched your location. Check browser location permission and try again.
                      </LuxeText>
                    ) : null}
                    {councilStatus === 'denied' ? (
                      <LuxeText variant="caption" style={{ color: au.red, textAlign: 'center' }}>
                        Location permission is required to detect your council.
                      </LuxeText>
                    ) : null}
                  </View>
                ) : (
                  <View style={{ backgroundColor: luxe.surfaceElevated, borderRadius: 12, padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <LuxeText variant="body" style={{ color: luxe.text, fontWeight: '600' }}>
                          {detectedCouncil.name}
                        </LuxeText>
                        {distanceKm != null && (
                          <LuxeText variant="caption" style={{ color: luxe.textSecondary, marginTop: 2 }}>
                            {distanceKm.toFixed(0)} km away • {matchMethod}
                          </LuxeText>
                        )}
                      </View>
                      <LuxeButton
                        variant="filled"
                        gradientColors={au.gradient}
                        size="sm"
                        onPress={async () => {
                          setCouncil(detectedCouncil.id, detectedCouncil.lgaCode);
                          if (user?.id) {
                            try {
                              await api.council.select(detectedCouncil.id);
                            } catch (e) {
                              if (__DEV__) console.warn('[location] Failed to persist council to profile', e);
                            }
                          }
                          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }}
                      >
                        Use
                      </LuxeButton>
                    </View>

                    <LuxeButton
                      variant="glass"
                      size="sm"
                      onPress={resetCouncil}
                      style={{ marginTop: 10, alignSelf: 'flex-start' }}
                    >
                      Detect again
                    </LuxeButton>
                  </View>
                )}</LuxeCard>
            )}

            {step === 'city' ? (
              <View
                style={[
                  s.locationFooterPanel,
                  {
                    borderColor: au.panelBorder,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <View style={s.statePickerAccent}>
                  <View style={[s.statePickerAccentBar, { backgroundColor: au.blue }]} />
                  <View style={[s.statePickerAccentBar, { backgroundColor: au.red }]} />
                </View>
                <View style={s.locationFooterBody}>
                  <LuxeButton
                    variant="glass"
                    size="sm"
                    onPress={goBackWithinFlow}
                    leftIcon="arrow-back"
                    style={{
                      alignSelf: 'flex-start',
                      borderWidth: 1.5,
                      borderColor: au.cardBorder,
                    }}
                  >
                    Back
                  </LuxeButton>
                  <LuxeButton
                    variant="filled"
                    gradientColors={au.gradient}
                    rightIcon="arrow-forward"
                    disabled={!state.country || !state.city}
                    onPress={handleNext}
                    style={{ height: 46, marginTop: 10 }}
                  >
                    Continue
                  </LuxeButton>
                  {(!state.country || !state.city) && (
                    <LuxeText
                      variant="caption"
                      style={[s.continueHint, { color: luxe.textTertiary, fontSize: 15 }]}
                    >
                      Choose a city to continue
                    </LuxeText>
                  )}
                </View>
              </View>
            ) : (
              <>
                <LuxeButton
                  variant="filled"
                  gradientColors={au.gradient}
                  rightIcon="arrow-forward"
                  disabled={!state.country || !state.city}
                  onPress={handleNext}
                  style={{ height: 46 }}
                >
                  Continue
                </LuxeButton>

                {(!state.country || !state.city) && (
                  <LuxeText variant="caption" style={{ textAlign: 'center', marginTop: 10, color: luxe.textTertiary, fontSize: 15 }}>
                    {step === 'country'
                      ? 'Select a country to continue'
                      : 'Select your state to continue'}
                  </LuxeText>
                )}
              </>
            )}

            <OnboardingRestartLink redirectTo={redirectTo} au={au} />
          </LuxeCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1 },

  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingBottom: 48,
    justifyContent: 'center',
  },
  scrollContentDesktop: { paddingVertical: 36 },

  mobileProgressWrap: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  stepText: {
    letterSpacing: 1,
  },
  progressTrack: {
    width: 100,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },

  formContainer: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    borderRadius: 20,
  },
  formContainerDesktop: { maxWidth: 420 },

  formContent: { padding: 14 },

  // Breadcrumb
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  desktopStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  desktopStepItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 76,
  },
  desktopStepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  desktopDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  desktopStepLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  desktopStepLine: {
    width: 48,
    height: 1,
    marginHorizontal: 4,
    marginBottom: 20,
  },

  // Header
  headerBlock: { alignItems: 'center', marginBottom: 10 },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { textAlign: 'center', marginBottom: 6, fontSize: 28, lineHeight: 34 },
  titleAccentRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6,
  },
  titleAccentBar: {
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
    fontSize: 16,
    lineHeight: 22,
  },

  // GPS suggestion card (country detected)
  gpsSuggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  gpsSuggestIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsSuggestTextWrap: { flex: 1, gap: 2 },
  gpsSuggestEyebrow: {
    letterSpacing: 0.8,
  },
  gpsSuggestCountry: { letterSpacing: -0.2 },

  // Or divider


  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 14 },

  // Back link
  backLinkRow: { marginTop: 10, alignItems: 'flex-start' },

  statePickerPanel: {
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 2,
  },
  locationFooterPanel: {
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  locationFooterBody: {
    padding: 12,
    gap: 0,
  },
  statePickerAccent: {
    flexDirection: 'row',
    height: 4,
  },
  statePickerAccentBar: {
    flex: 1,
  },
  statePickerHeader: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  statePickerDivider: {
    height: StyleSheet.hairlineWidth * 2,
    marginHorizontal: 12,
  },
  // Compact three-column picker grid (states & cities)
  stateList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    paddingTop: 6,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerGridItem: {
    width: '31.5%',
    flexGrow: 0,
  },
  pickerCard: {
    width: '100%',
    borderRadius: 10,
  },
  pickerCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 2,
    minHeight: 50,
  },
  pickerCardInnerCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 4,
    minHeight: 44,
  },
  pickerEmoji: {
    fontSize: 18,
  },
  pickerCardBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, height: '100%' },

  cityPickerBody: {
    padding: 8,
    paddingTop: 6,
  },
  noResults: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  noResultsText: { textAlign: 'center' },

  spacer: { height: 12 },
  continueHint: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
  },
});
