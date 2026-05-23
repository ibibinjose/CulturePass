import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  type DimensionValue,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInLeft,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useLocations } from '@/hooks/useLocations';
import { useNearestMarketplaceLocation } from '@/hooks/useNearestMarketplaceLocation';
import { useDetectCountry } from '@/hooks/useDetectCountry';

import { M3Button, M3Card, M3TopAppBar, M3FilterChip } from '@/design-system/ui';

import {
  CultureTokens,
  FontFamily,
  IconSize,
  M3Typography,
} from '@/design-system/tokens/theme';

import * as Haptics from 'expo-haptics';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import {
  getCountryFlag,
  getCountryForCity,
  getRegionsForCountry,
  listMarketplaceCountries,
  resolveCountryPickerPin,
} from '@/lib/marketplaceLocation';
import { useAuth } from '@/lib/auth';
import { syncUserMarketplaceLocation } from '@/lib/syncMarketplaceLocation';
import { CountrySelectList } from '@/components/location/CountrySelectList';

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
  region: "We'll surface cultural events and communities near you.",
  city: "Pick your city and we'll show what's happening nearby.",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocationScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { isDesktop, windowSizeClass } = useLayout();
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);
  const isExpanded = windowSizeClass === 'expanded';

  const { user } = useAuth();
  const { state, setCountry, setCity } = useOnboarding();
  const { states, getStateForCity, isLoading: locationsLoading, error: locationsError } = useLocations();

  // City detection — marketplace countries (region step)
  const { detect: detectCity, status: cityDetectStatus } = useNearestMarketplaceLocation();
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

  // ---------------------------------------------------------------------------
  // Animated progress bar
  // ---------------------------------------------------------------------------

  const progressWidth = useSharedValue(0);
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    progressWidth.value = withTiming((stepIndex + 1) / STEPS.length, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [stepIndex, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as DimensionValue,
  }));

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

  // ---------------------------------------------------------------------------
  // Finish
  // ---------------------------------------------------------------------------

  const handleNext = () => {
    if (state.country && state.city) {
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
        <M3Card
          variant="filled"
          onPress={() => selectMarketplaceCountry(gpsCountry)}
          style={[
            s.gpsSuggestCard,
            {
              backgroundColor: m3Colors.primaryContainer,
              marginBottom: 16,
            },
          ]}
        >
          <View style={[s.gpsSuggestIconWrap, { backgroundColor: m3Colors.onPrimaryContainer + '20' }]}>
            <Ionicons name="navigate-circle" size={24} color={m3Colors.onPrimaryContainer} />
          </View>
          <View style={s.gpsSuggestTextWrap}>
            <Text style={[s.gpsSuggestEyebrow, M3Typography.labelSmall, { color: m3Colors.onPrimaryContainer }]}>SUGGESTED FOR YOU</Text>
            <Text style={[s.gpsSuggestCountry, M3Typography.titleMedium, { color: m3Colors.onPrimaryContainer }]}>
              {getCountryFlag(gpsCountry)}{'  '}{gpsCountry}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={m3Colors.onPrimaryContainer} />
        </M3Card>
      );
    }

    return (
      <M3Button
        variant="tonal"
        onPress={handleDetectCountry}
        disabled={isDetectingCountry}
        loading={isDetectingCountry}
        leftIcon="navigate-circle"
        style={{ marginBottom: 16, height: 64, borderRadius: 16 }}
      >
        Detect my country
      </M3Button>
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

      {!isDesktop && (
        <View style={s.mobileProgressWrap}>
          <Text style={[s.stepText, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>STEP {stepIndex + 1} OF 3</Text>
          <View style={[s.progressTrack, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
            <Animated.View style={[s.progressFill, progressBarStyle, { backgroundColor: m3Colors.primary }]} />
          </View>
        </View>
      )}

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enter(40)} style={[s.formContainer, isDesktop && s.formContainerDesktop]}>
          <M3Card variant="elevated" style={s.formContent}>

            {/* Breadcrumb — shown after country is chosen */}
            {step !== 'country' && (
              <View style={s.breadcrumbRow}>
                {breadcrumbItems.map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <Ionicons name="chevron-forward" size={12} color={m3Colors.onSurfaceVariant} />
                    )}
                    <M3FilterChip
                      label={item.label}
                      onPress={() => {}}
                      selected={item.active}
                      style={{ height: 28 }}
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
                              ? { backgroundColor: CultureTokens.teal, borderColor: CultureTokens.teal }
                              : isActive
                                ? {
                                    borderColor: CultureTokens.gold,
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
                                  ? { backgroundColor: CultureTokens.gold }
                                  : { backgroundColor: colors.textTertiary },
                              ]}
                            />
                          )}
                        </View>
                        <Text style={[s.desktopStepLabel, { color: isActive ? colors.text : colors.textTertiary }]}>
                          {STEP_LABELS[i]}
                        </Text>
                      </View>
                      {i < STEPS.length - 1 && (
                        <View
                          style={[
                            s.desktopStepLine,
                            { backgroundColor: isDone ? CultureTokens.teal : colors.borderLight },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </Animated.View>
            )}

            {/* Step icon + title */}
            <View style={s.headerBlock}>
              <View style={[s.iconWrapper, { backgroundColor: m3Colors.primaryContainer }]}>
                <Animated.View key={step} entering={FadeIn.duration(200)}>
                  <Ionicons name={STEP_ICON[step]} size={34} color={m3Colors.onPrimaryContainer} />
                </Animated.View>
              </View>
              <Text style={[s.title, M3Typography.headlineMedium, { color: m3Colors.onSurface }]}>{STEP_TITLE[step](pendingCountry)}</Text>
              <Text style={[s.subtitle, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>{STEP_SUBTITLE[step]}</Text>
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
                    <M3Button
                        variant="tonal"
                        onPress={handleDetectCity}
                        disabled={isDetectingCity}
                        loading={isDetectingCity}
                        leftIcon="navigate-circle"
                        style={{ height: 64, borderRadius: 16, marginBottom: 16 }}
                    >
                        Use my location
                    </M3Button>
                  )}

                  {pendingCountry === 'Australia' && locationsLoading && (
                    <ActivityIndicator size="large" color={m3Colors.primary} style={{ paddingVertical: 20 }} />
                  )}

                  {pendingCountry === 'Australia' && !!locationsError && (
                    <View style={[s.errorBanner, { backgroundColor: m3Colors.errorContainer }]}>
                      <Ionicons name="alert-circle" size={IconSize.md} color={m3Colors.error} />
                      <Text style={[s.errorText, { color: m3Colors.error }]}>Failed to load locations.</Text>
                    </View>
                  )}

                  {pendingCountry === 'Australia' && !locationsLoading && (
                    <View style={s.orDivider}>
                      <View style={[s.orDividerLine, { backgroundColor: m3Colors.outlineVariant }]} />
                      <Text style={[s.orDividerText, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>OR CHOOSE A STATE</Text>
                      <View style={[s.orDividerLine, { backgroundColor: m3Colors.outlineVariant }]} />
                    </View>
                  )}

                  <View style={s.stateGrid}>
                    {regions.map((st) => {
                      const isSelected = st.code === pendingState;
                      return (
                        <M3Card
                          key={st.code}
                          variant={isSelected ? 'filled' : 'outlined'}
                          onPress={() => selectRegion(st.code)}
                          style={[
                            s.stateCard,
                            {
                              backgroundColor: isSelected ? m3Colors.primaryContainer : 'transparent',
                              borderColor: isSelected ? 'transparent' : m3Colors.outlineVariant,
                            },
                          ]}
                        >
                          <Text style={s.stateEmoji}>{st.emoji}</Text>
                          <Text style={[s.stateName, M3Typography.labelLarge, { color: isSelected ? m3Colors.onPrimaryContainer : m3Colors.onSurface }]}>
                            {st.name}
                          </Text>
                          <Text style={[s.cityCount, M3Typography.labelSmall, { color: isSelected ? m3Colors.onPrimaryContainer : m3Colors.onSurfaceVariant }]}>
                            {st.cities.length} cities
                          </Text>
                        </M3Card>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ── City Step ── */}
              {step === 'city' && (
                <View>
                  <View
                    style={[
                      s.searchBar,
                      { backgroundColor: m3Colors.surfaceContainerHigh, borderWidth: 0, height: 56, borderRadius: 28, marginBottom: 16 },
                    ]}
                  >
                    <Ionicons name="search" size={24} color={m3Colors.onSurfaceVariant} />
                    <TextInput
                      style={[s.searchInput, { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 }]}
                      placeholder={`Search ${allCitiesForState.length} cities…`}
                      placeholderTextColor={m3Colors.onSurfaceVariant}
                      value={citySearch}
                      onChangeText={setCitySearch}
                      autoCorrect={false}
                      autoCapitalize="words"
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                    />
                    {citySearch.length > 0 && Platform.OS !== 'ios' && (
                      <Pressable onPress={() => setCitySearch('')} hitSlop={8}>
                        <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
                      </Pressable>
                    )}
                  </View>

                  {citiesToShow.length === 0 ? (
                    <M3Card variant="outlined" style={s.noResults}>
                      <Ionicons name="search-outline" size={48} color={m3Colors.onSurfaceVariant} />
                      <Text style={[s.noResultsText, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                        No cities match
                      </Text>
                      <M3Button variant="text" onPress={() => setCitySearch('')}>Clear search</M3Button>
                    </M3Card>
                  ) : (
                    <View style={s.cityGrid}>
                      {citiesToShow.map((city) => {
                        const isActive = state.city === city;
                        return (
                          <M3Card
                            key={city}
                            variant={isActive ? 'filled' : 'outlined'}
                            onPress={() => selectCity(city)}
                            style={[
                              s.cityCard,
                              {
                                backgroundColor: isActive ? m3Colors.primary : 'transparent',
                                borderColor: isActive ? 'transparent' : m3Colors.outlineVariant,
                              },
                            ]}
                          >
                            <Ionicons
                                name={isActive ? "checkmark-circle" : "location-outline"}
                                size={20}
                                color={isActive ? m3Colors.onPrimary : m3Colors.primary}
                            />
                            <Text
                              style={[
                                s.cityName,
                                M3Typography.labelLarge,
                                { color: isActive ? m3Colors.onPrimary : m3Colors.onSurface },
                              ]}
                              numberOfLines={1}
                            >
                              {city}
                            </Text>
                          </M3Card>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Back-within-flow link */}
            {step !== 'country' && (
              <View style={s.backLinkRow}>
                <M3Button
                  variant="text"
                  onPress={goBackWithinFlow}
                  leftIcon="arrow-back"
                >
                    Back
                </M3Button>
              </View>
            )}

            <View style={s.spacer} />

            <M3Button
              variant="filled"
              rightIcon="arrow-forward"
              disabled={!state.country || !state.city}
              onPress={handleNext}
              style={{ height: 58, borderRadius: 20 }}
            >
              Continue
            </M3Button>

            {(!state.country || !state.city) && (
              <Text style={[s.continueHint, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                {step === 'country'
                  ? 'Select a country to continue'
                  : step === 'region'
                    ? 'Select your state to continue'
                    : 'Choose a city to continue'}
              </Text>
            )}
          </M3Card>
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
    paddingHorizontal: 20,
    paddingBottom: 80,
    justifyContent: 'center',
  },
  scrollContentDesktop: { paddingVertical: 80 },

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
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 32,
  },
  formContainerDesktop: { maxWidth: 520 },

  formContent: { padding: 32 },

  // Breadcrumb
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  desktopStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
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
  headerBlock: { alignItems: 'center', marginBottom: 32 },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: {
    textAlign: 'center',
    maxWidth: 340,
  },

  // GPS suggestion card (country detected)
  gpsSuggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 20,
  },
  gpsSuggestIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsSuggestTextWrap: { flex: 1, gap: 2 },
  gpsSuggestEyebrow: {
    letterSpacing: 0.8,
  },
  gpsSuggestCountry: { letterSpacing: -0.2 },

  // Or divider
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  orDividerLine: { flex: 1, height: 1 },
  orDividerText: {
    letterSpacing: 0.4,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  errorText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 14 },

  // Back link
  backLinkRow: { marginTop: 16, alignItems: 'flex-start' },

  // State grid
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    width: '48%',
    minHeight: 110,
  },
  stateEmoji: { fontSize: 36 },
  stateName: { textAlign: 'center' },
  cityCount: { textAlign: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, height: '100%' },

  // City grid
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    width: '48.2%',
    minHeight: 56,
  },
  cityName: { flex: 1 },

  noResults: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  noResultsText: { textAlign: 'center' },

  spacer: { height: 24 },
  continueHint: {
    textAlign: 'center',
    marginTop: 12,
  },
});
