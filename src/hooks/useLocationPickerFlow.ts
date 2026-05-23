import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { syncUserMarketplaceLocation } from '@/lib/syncMarketplaceLocation';
import { useLocations } from '@/hooks/useLocations';
import { useNearestMarketplaceLocation } from '@/hooks/useNearestMarketplaceLocation';
import {
  getCountryFlag,
  getCountryForCity,
  getRegionsForCountry,
  listMarketplaceCountries,
  resolveCountryPickerPin,
} from '@/lib/marketplaceLocation';

const isWeb = Platform.OS === 'web';

export type LocationPickerStep = 'country' | 'region' | 'city';

export function useLocationPickerFlow() {
  const { user } = useAuth();
  const { state, updateLocation } = useOnboarding();
  const { states, getStateForCity, isLoading: locationsLoading, error: locationsError } = useLocations();
  const { detect, status: detectStatus } = useNearestMarketplaceLocation();
  const isDetecting = detectStatus === 'requesting';

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<LocationPickerStep>('country');
  const [pendingCountry, setPendingCountry] = useState('');
  const [pendingState, setPendingState] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const bottomInsetNative = isWeb ? 0 : Math.max(insets.bottom, 12);
  const listPadBottom = isWeb ? 80 : bottomInsetNative + 28;

  const scrollCommon = useMemo(
    () => ({
      keyboardShouldPersistTaps: 'handled' as const,
      keyboardDismissMode: (Platform.OS === 'ios' ? 'interactive' : 'on-drag') as 'interactive' | 'on-drag',
      showsVerticalScrollIndicator: false,
      automaticallyAdjustKeyboardInsets: Platform.OS === 'ios',
    }),
    [],
  );

  const countries = useMemo(() => listMarketplaceCountries(), []);

  const preferCountryFirst = useMemo(
    () => resolveCountryPickerPin({ savedCountry: state.country, savedCity: state.city }),
    [state.country, state.city],
  );

  const open = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('country');
    setPendingCountry('');
    setPendingState('');
    setCitySearch('');
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(false);
  }, []);

  const selectCountry = useCallback(
    (countryName: string) => {
      Haptics.selectionAsync();
      setPendingCountry(countryName);
      setCitySearch('');
      const regs = getRegionsForCountry(countryName, states);
      if (countryName === 'Australia') {
        setPendingState('');
        setStep('region');
      } else if (regs.length === 1) {
        setPendingState(regs[0].code);
        setStep('city');
      } else {
        setPendingState('');
        setStep('region');
      }
    },
    [states],
  );

  const selectRegion = useCallback((code: string) => {
    Haptics.selectionAsync();
    setPendingState(code);
    setCitySearch('');
    setStep('city');
  }, []);

  const selectCity = useCallback(
    async (city: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const country = pendingCountry || state.country || 'Australia';
      await updateLocation(country, city);
      void syncUserMarketplaceLocation(user?.id, country, city);
      setVisible(false);
    },
    [pendingCountry, state.country, updateLocation, user?.id],
  );

  const handleDetectLocation = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await detect();
    if (r) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateLocation(r.country, r.city);
      void syncUserMarketplaceLocation(user?.id, r.country, r.city);
      setVisible(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [detect, updateLocation, user?.id]);

  const regions = useMemo(
    () => (pendingCountry ? getRegionsForCountry(pendingCountry, states) : []),
    [pendingCountry, states],
  );

  const pendingRegionMeta = useMemo(
    () => regions.find((r) => r.code === pendingState),
    [regions, pendingState],
  );

  const citiesFiltered = useMemo(() => {
    const list = pendingRegionMeta?.cities ?? [];
    const q = citySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.toLowerCase().includes(q));
  }, [pendingRegionMeta, citySearch]);

  const resolvedCountry =
    state.country || (state.city ? getCountryForCity(state.city) : '') || 'Australia';

  const homeRegions = useMemo(
    () => getRegionsForCountry(resolvedCountry, states),
    [resolvedCountry, states],
  );

  const currentStateCode = state.city ? getStateForCity(state.city) : undefined;
  const currentStateMeta = useMemo(
    () => (currentStateCode ? homeRegions.find((r) => r.code === currentStateCode) : undefined),
    [homeRegions, currentStateCode],
  );

  const country = resolvedCountry;
  const countryFlag = getCountryFlag(country);
  const headerFlag = getCountryFlag(pendingCountry || state.country || 'Australia');

  const locationLabel = state.city
    ? `${state.city}${
        currentStateCode && resolvedCountry === 'Australia' && currentStateMeta
          ? `, ${currentStateMeta.code}`
          : ''
      } · ${country}`
    : 'Select Location';

  const modalTitle =
    step === 'country' ? 'Country' : step === 'region' ? 'State or region' : 'City';

  const headerBack = useCallback(() => {
    if (step === 'city') {
      setCitySearch('');
      if (pendingCountry === 'Australia') {
        setStep('region');
      } else {
        setStep('country');
        setPendingState('');
        setPendingCountry('');
      }
      return;
    }
    if (step === 'region') {
      setStep('country');
      setPendingState('');
      setPendingCountry('');
      return;
    }
    close();
  }, [step, pendingCountry, close]);

  const setCitySearchCb = useCallback((t: string) => setCitySearch(t), []);

  return {
    state,
    visible,
    step,
    pendingCountry,
    pendingState,
    citySearch,
    setCitySearch: setCitySearchCb,
    open,
    close,
    selectCountry,
    selectRegion,
    selectCity,
    handleDetectLocation,
    headerBack,
    scrollCommon,
    countries,
    preferCountryFirst,
    regions,
    pendingRegionMeta,
    citiesFiltered,
    countryFlag,
    headerFlag,
    locationLabel,
    modalTitle,
    locationsLoading,
    locationsError,
    isDetecting,
    topInset,
    bottomInsetNative,
    listPadBottom,
    resolvedCountry,
    currentStateCode,
    stateCountry: state.country,
    stateCity: state.city,
  };
}
