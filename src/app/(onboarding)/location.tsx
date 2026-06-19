import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, FadeInLeft, FadeInDown } from 'react-native-reanimated';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboardingTheme } from '@/hooks/useOnboardingTheme';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { FontFamily } from '@/design-system/tokens/theme';
import { australianPostcodes } from '@shared/location/australian-postcodes';
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
import { useLocations } from '@/hooks/useLocations';
import { useNearestMarketplaceLocation } from '@/hooks/useNearestMarketplaceLocation';
import { useDetectCountry } from '@/hooks/useDetectCountry';
import { useNearestCouncil } from '@/hooks/useNearestCouncil';
import { sanitizeInternalRedirect, routeWithRedirect } from '@/lib/routes';
import {
  getCountryFlag,
  getCountryForCity,
  getRegionsForCountry,
  listMarketplaceCountries,
  resolveCountryPickerPin,
} from '@/lib/marketplaceLocation';
import { api } from '@/lib/api';
import { syncUserMarketplaceLocation } from '@/lib/syncMarketplaceLocation';
import { CountrySelectList } from '@/components/location/CountrySelectList';
import { showUserAlert } from '@/lib/showUserAlert';

type AustralianState = {
  code: string;
  name: string;
  emoji?: string;
};

export function getAustralianStates(): AustralianState[] {
  const statesSet = new Set(australianPostcodes.map((pc: any) => pc.state_code));
  return Array.from(statesSet).map((code) => {
    const stateName =
      australianPostcodes.find((pc: any) => pc.state_code === code)?.state_name || code;
    return { code, name: stateName, emoji: '🇦🇺' };
  });
}

export function getCitiesForState(stateCode: string): string[] {
  const filteredPostcodes = australianPostcodes.filter((pc: any) => pc.state_code === stateCode);
  const uniqueCities = Array.from(new Set(filteredPostcodes.map((pc: any) => pc.place_name)));
  return uniqueCities.sort();
}

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

export default function LocationScreen() {
  const colors = useColors();
  const { au } = useOnboardingTheme();
  const m3Colors = useM3Colors();
  const { isDesktop, windowSizeClass } = useLayout();
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);
  const isExpanded = windowSizeClass === 'expanded';

  const { user } = useAuth();
  const { state, setCountry, setCity, setCouncil } = useOnboarding();
  const { states, getStateForCity, isLoading: locationsLoading } = useLocations();

  const { detect: detectCity, status: cityDetectStatus } = useNearestMarketplaceLocation();
  const {
    detect: detectCouncil,
    council: detectedCouncil,
    distanceKm,
    matchMethod,
    confidence,
    status: councilStatus,
    reset: resetCouncil,
  } = useNearestCouncil();
  const isDetectingCity = cityDetectStatus === 'requesting';

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
  const countries = useMemo(() => listMarketplaceCountries(), []);

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

  const goToStep = (next: LocStep, dir: 'forward' | 'back') => {
    setStepDir(dir);
    setStep(next);
  };

  const goBackWithinFlow = () => {
    if (step === 'city') {
      setCitySearch('');
      resetCouncil();
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

  const selectMarketplaceCountry = (countryName: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    resetGpsCountry();
    setPendingCountry(countryName);
    setCitySearch('');
    if (countryName !== 'Australia') resetCouncil();
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
    if (c === 'Australia') resetCouncil();
  };

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
        Alert.alert(
          'Could Not Detect Location',
          'We could not match your position to a city in our list. Please choose your city manually.',
        );
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

  const handleNext = () => {
    if (state.country && state.city) {
      void syncUserMarketplaceLocation(user?.id, state.country, state.city);
      router.replace(routeWithRedirect('/(onboarding)/communities', redirectTo) as string);
      return;
    }
    Alert.alert('Select Location', 'Please choose your state and city to continue.');
  };

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

  const regionsToShow = useMemo(() => {
    if (!pendingCountry) return [];
    if (pendingCountry === 'Australia') {
      const auRegions = (regions || []).filter((r) =>
        ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].includes(r.code),
      );
      const rawStates = auRegions.length > 0 ? auRegions : australianStatesFallback;
      return rawStates.map((st) => {
        const count = Array.isArray(st.cities)
          ? st.cities.length
          : typeof st.cities === 'number'
            ? st.cities
            : 0;
        const safeCount =
          count > 0 ? count : (australianStatesFallback.find((f) => f.code === st.code)?.cities ?? 0);
        return {
          code: st.code,
          name: st.name,
          emoji: st.emoji || '🇦🇺',
          sublabel: safeCount > 0 ? `${safeCount} cities` : undefined,
        };
      });
    }
    return regions.map((r) => ({
      code: r.code,
      name: r.name,
      emoji: r.emoji || '📍',
      sublabel: r.cities?.length ? `${r.cities.length} cities` : undefined,
    }));
  }, [pendingCountry, regions]);

  const pathSummary = useMemo(() => {
    const parts: string[] = [];
    if (pendingCountry) parts.push(pendingCountry);
    if (pendingRegionMeta?.name) parts.push(pendingRegionMeta.name);
    if (state.city) parts.push(state.city);
    return parts.join(' · ');
  }, [pendingCountry, pendingRegionMeta?.name, state.city]);

  const continueHint =
    step === 'country'
      ? 'Select a country to continue'
      : step === 'region'
        ? 'Select your region to continue'
        : 'Choose a city to continue';

  const canContinue = !!state.country && !!state.city;
  const showCouncil =
    !!state.city && (pendingCountry === 'Australia' || state.country === 'Australia');

  const stepEntering =
    stepDir === 'forward'
      ? FadeInRight.duration(260).springify().damping(22).stiffness(130)
      : FadeInLeft.duration(260).springify().damping(22).stiffness(130);

  const renderGpsCountrySlot = () => {
    if (gpsCountry) {
      return (
        <LuxeCard
          variant="filled"
          onPress={() => selectMarketplaceCountry(gpsCountry)}
          style={[s.gpsCard, { backgroundColor: au.blue }]}
        >
          <View style={[s.gpsIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="navigate-circle" size={22} color="#FFF" />
          </View>
          <View style={s.gpsCopy}>
            <LuxeText variant="badgeCaps" style={{ color: au.red, fontSize: 10 }}>
              SUGGESTED FOR YOU
            </LuxeText>
            <LuxeText variant="bodyMedium" style={{ color: '#FFF', fontFamily: FontFamily.semibold }}>
              {getCountryFlag(gpsCountry)} {gpsCountry}
            </LuxeText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </LuxeCard>
      );
    }
    return (
      <OnboardingPrimaryButton
        au={au}
        leftIcon="navigate-circle"
        onPress={handleDetectCountry}
        disabled={isDetectingCountry}
        loading={isDetectingCountry}
        style={{ width: '100%' }}
      >
        Detect my country
      </OnboardingPrimaryButton>
    );
  };

  const renderCountryStep = () => (
    <OnboardingPanel
      title="Select your country"
      subtitle="We'll show events and communities for your marketplace."
      au={au}
      colors={colors}
    >
      {renderGpsCountrySlot()}
      <CountrySelectList
        countries={countries}
        selectedName={pendingCountry || state.country || undefined}
        preferCountryFirst={preferCountryFirst}
        onSelect={selectMarketplaceCountry}
        variant="onboarding"
        onboardingLayout="list"
        au={au}
        colors={colors}
        showFooterHint={false}
      />
    </OnboardingPanel>
  );

  const renderRegionStep = () => (
    <OnboardingPanel
      title={STEP_TITLE.region(pendingCountry)}
      subtitle={STEP_SUBTITLE.region}
      au={au}
      colors={colors}
    >
      {pendingCountry === 'Australia' ? (
        <OnboardingPrimaryButton
          au={au}
          leftIcon="navigate-circle"
          onPress={handleDetectCity}
          disabled={isDetectingCity}
          loading={isDetectingCity}
          style={{ width: '100%' }}
        >
          Use my location
        </OnboardingPrimaryButton>
      ) : null}

      {pendingCountry === 'Australia' && locationsLoading ? (
        <ActivityIndicator size="large" color={au.blue} style={{ paddingVertical: 24 }} />
      ) : regionsToShow.length === 0 ? (
        <LuxeText variant="body" style={{ textAlign: 'center', color: au.body, paddingVertical: 16 }}>
          No regions available for this country.
        </LuxeText>
      ) : (
        <OnboardingPickerGrid columns={2}>
          {regionsToShow.map((region) => (
            <OnboardingPickerTile
              key={region.code}
              label={region.name}
              emoji={region.emoji}
              sublabel={region.sublabel}
              selected={region.code === pendingState}
              onPress={() => selectRegion(region.code)}
              au={au}
              colors={colors}
              columns={2}
            />
          ))}
        </OnboardingPickerGrid>
      )}
    </OnboardingPanel>
  );

  const renderCityStep = () => (
    <OnboardingPanel
      title={STEP_TITLE.city()}
      subtitle={STEP_SUBTITLE.city}
      au={au}
      colors={colors}
    >
      {state.city ? (
        <OnboardingSelectionBadge label={`${state.city} selected`} au={au} />
      ) : null}

      <OnboardingSearchBar
        value={citySearch}
        onChangeText={setCitySearch}
        placeholder={`Search ${allCitiesForState.length} cities…`}
        au={au}
        colors={colors}
        accessibilityLabel="Search cities"
      />

      {citiesToShow.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="search-outline" size={36} color={au.bodyMuted} />
          <LuxeText variant="body" style={{ color: au.heading, textAlign: 'center' }}>
            No cities match your search
          </LuxeText>
          <LuxeButton variant="glass" size="sm" onPress={() => setCitySearch('')}>
            Clear search
          </LuxeButton>
        </View>
      ) : (
        <OnboardingPickerGrid columns={1}>
          {citiesToShow.map((city) => (
            <OnboardingPickerTile
              key={city}
              label={city}
              emoji="📍"
              selected={state.city === city}
              onPress={() => selectCity(city)}
              au={au}
              colors={colors}
              columns={1}
            />
          ))}
        </OnboardingPickerGrid>
      )}
    </OnboardingPanel>
  );

  const renderCouncilSection = () => {
    if (!showCouncil) return null;
    return (
      <OnboardingPanel
        title="Local council (LGA)"
        subtitle="Optional — get more tailored events near you."
        au={au}
        colors={colors}
      >
        {councilStatus === 'requesting' ? (
          <View style={s.inlineRow}>
            <ActivityIndicator size="small" color={au.blue} />
            <LuxeText variant="body" style={{ color: au.body }}>
              Detecting your council…
            </LuxeText>
          </View>
        ) : !detectedCouncil ? (
          <View style={{ gap: 8 }}>
            <OnboardingPrimaryButton
              au={au}
              leftIcon="navigate-circle"
              onPress={handleDetectCouncil}
              style={{ width: '100%' }}
            >
              Detect my local council
            </OnboardingPrimaryButton>
            {councilStatus === 'error' || councilStatus === 'denied' ? (
              <LuxeText variant="caption" style={{ color: au.red, textAlign: 'center' }}>
                {councilStatus === 'denied'
                  ? 'Location permission is required to detect your council.'
                  : 'No council matched your location. Try again or continue without it.'}
              </LuxeText>
            ) : null}
          </View>
        ) : (
          <View
            style={[
              s.councilResult,
              { backgroundColor: au.blueContainer, borderColor: au.cardBorder },
            ]}
          >
            <View style={s.councilResultTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <LuxeText variant="bodyMedium" style={{ color: au.selectedText, fontFamily: FontFamily.semibold }}>
                  {detectedCouncil.name}
                </LuxeText>
                {distanceKm != null ? (
                  <LuxeText variant="caption" style={{ color: au.body, marginTop: 2 }}>
                    {distanceKm.toFixed(0)} km away · {matchMethod}
                    {confidence ? ` · ${confidence}` : ''}
                  </LuxeText>
                ) : null}
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
                      if (__DEV__) console.warn('[location] Failed to persist council', e);
                    }
                  }
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
              >
                Use
              </LuxeButton>
            </View>
            <LuxeButton variant="glass" size="sm" onPress={resetCouncil} style={{ alignSelf: 'flex-start' }}>
              Detect again
            </LuxeButton>
          </View>
        )}
      </OnboardingPanel>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: m3Colors.background }]}>
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

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            onboardingFormStyles.scroll,
            isDesktop && onboardingFormStyles.scrollDesktop,
          ]}
        >
          <Animated.View entering={FadeInDown.springify().damping(20).stiffness(120).delay(80)}>
            <LuxeCard
              variant="glass"
              style={[
                onboardingFormStyles.glassCard,
                isDesktop && onboardingFormStyles.glassCardDesktop,
              ]}
            >
              {redirectTo ? <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" /> : null}

              <View style={s.innerStepper}>
                {STEPS.map((st, i, arr) => {
                  const isDone = i < stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <React.Fragment key={st}>
                      <View style={s.innerStepItem}>
                        <View
                          style={[
                            s.innerStepCircle,
                            isDone
                              ? { backgroundColor: au.blue, borderColor: au.blue }
                              : isActive
                                ? {
                                    borderColor: au.red,
                                    borderWidth: 2,
                                    backgroundColor: colors.surfaceElevated,
                                  }
                                : {
                                    borderColor: au.cardBorder,
                                    borderWidth: 1.5,
                                    backgroundColor: colors.surfaceElevated,
                                  },
                          ]}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={11} color="#FFF" />
                          ) : (
                            <Ionicons
                              name={STEP_ICON[st]}
                              size={12}
                              color={isActive ? au.blue : au.bodyMuted}
                            />
                          )}
                        </View>
                        <LuxeText
                          variant="caption"
                          style={{
                            marginTop: 4,
                            color: isActive ? au.heading : au.bodyMuted,
                            fontSize: 9,
                            fontFamily: FontFamily.medium,
                          }}
                        >
                          {STEP_LABELS[i]}
                        </LuxeText>
                      </View>
                      {i < arr.length - 1 ? (
                        <View
                          style={[
                            s.innerStepLine,
                            { backgroundColor: isDone ? au.blue : au.cardBorder },
                          ]}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </View>

              <OnboardingHero
                icon={STEP_ICON[step]}
                title={STEP_TITLE[step](pendingCountry)}
                subtitle={STEP_SUBTITLE[step]}
                au={au}
              />

              {pathSummary && step !== 'country' ? (
                <View style={[s.pathChip, { backgroundColor: au.blueContainer, borderColor: au.cardBorder }]}>
                  <Ionicons name="trail-sign-outline" size={14} color={au.blue} />
                  <LuxeText variant="caption" style={{ color: au.selectedText, flex: 1 }} numberOfLines={1}>
                    {pathSummary}
                  </LuxeText>
                </View>
              ) : null}

              <Animated.View key={step} entering={stepEntering}>
                {step === 'country' && renderCountryStep()}
                {step === 'region' && renderRegionStep()}
                {step === 'city' && renderCityStep()}
              </Animated.View>

              {renderCouncilSection()}

              <OnboardingFooterPanel au={au} colors={colors}>
                {step !== 'country' ? (
                  <LuxeButton
                    variant="glass"
                    size="sm"
                    onPress={goBackWithinFlow}
                    leftIcon="arrow-back"
                    style={{ alignSelf: 'flex-start', borderWidth: 1.5, borderColor: au.cardBorder }}
                  >
                    Back
                  </LuxeButton>
                ) : null}
                <OnboardingPrimaryButton
                  au={au}
                  rightIcon="arrow-forward"
                  disabled={!canContinue}
                  onPress={handleNext}
                  style={{ width: '100%' }}
                >
                  Continue
                </OnboardingPrimaryButton>
                {!canContinue ? (
                  <LuxeText variant="caption" style={{ color: au.bodyMuted, textAlign: 'center' }}>
                    {continueHint}
                  </LuxeText>
                ) : null}
              </OnboardingFooterPanel>

              <OnboardingRestartLink redirectTo={redirectTo} au={au} />
            </LuxeCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  innerStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  innerStepItem: { alignItems: 'center' },
  innerStepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerStepLine: {
    width: 40,
    height: 2,
    marginBottom: 16,
    marginHorizontal: 6,
  },

  pathChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 10,
  },

  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  gpsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsCopy: { flex: 1, gap: 2 },

  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },

  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  councilResult: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  councilResultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});