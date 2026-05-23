import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import {
  ALL_CULTURES,
  ALL_NATIONALITIES,
  getCulturesForNationality,
  getDiasporaGroupsForNationality,
  searchNationalities,
  type Nationality,
  type Culture,
} from '@/constants/cultures';
import { COMMON_LANGUAGES, searchLanguages, type Language } from '@/constants/languages';

export type Step = 'nationality' | 'culture' | 'exploring' | 'language';

const STEP_ORDER: Step[] = ['nationality', 'culture', 'exploring', 'language'];

export function useCultureMatch() {
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const {
    state,
    setNationalityId,
    setCultureIds,
    setExploringCultureIds,
    setLanguageIds,
    setDiasporaGroupIds,
    setEthnicityText,
    setLanguages,
    skipStep: skipOnboardingStep,
  } = useOnboarding();

  const [step, setStep] = useState<Step>('nationality');
  const [nationalityQuery, setNationalityQuery] = useState('');
  const [cultureQuery, setCultureQuery] = useState('');
  const [exploringQuery, setExploringQuery] = useState('');
  const [languageQuery, setLanguageQuery] = useState('');

  const [selectedNationality, setSelectedNationality] = useState<Nationality | null>(
    state.nationalityId ? (ALL_NATIONALITIES.find((n) => n.id === state.nationalityId) ?? null) : null,
  );
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>(state.cultureIds ?? []);
  const [selectedExploringCultureIds, setSelectedExploringCultureIds] = useState<string[]>(
    state.exploringCultureIds ?? [],
  );
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>(state.languageIds ?? []);

  const filteredNationalities = useMemo(() => searchNationalities(nationalityQuery), [nationalityQuery]);

  const availableCultures = useMemo(() => selectedNationality ? getCulturesForNationality(selectedNationality.id) : [], [selectedNationality]);

  const filteredCultures = useMemo(() => {
    const needle = cultureQuery.trim().toLowerCase();
    if (!needle) return availableCultures;
    return availableCultures.filter((c) => c.label.toLowerCase().includes(needle));
  }, [availableCultures, cultureQuery]);

  /**
   * Cultures the user could explore — everything in the taxonomy MINUS their
   * selected root cultures (you do not "explore" your own roots; you live
   * them). This list is searchable and filtered by `exploringQuery`.
   */
  const exploringCandidates = useMemo(
    () => ALL_CULTURES.filter((c) => !selectedCultureIds.includes(c.id)),
    [selectedCultureIds],
  );

  const filteredExploringCultures = useMemo(() => {
    const needle = exploringQuery.trim().toLowerCase();
    if (!needle) return exploringCandidates;
    return exploringCandidates.filter((c) => c.label.toLowerCase().includes(needle));
  }, [exploringCandidates, exploringQuery]);

  const filteredLanguages = useMemo(() => {
    const pool = languageQuery.trim().length >= 2 ? searchLanguages(languageQuery) : COMMON_LANGUAGES;
    return pool.filter((l) => !selectedLanguageIds.includes(l.id));
  }, [languageQuery, selectedLanguageIds]);

  const selectedLanguageObjects = useMemo(() => selectedLanguageIds.map((id) => COMMON_LANGUAGES.find((l) => l.id === id) ?? searchLanguages(id)[0]).filter(Boolean) as Language[], [selectedLanguageIds]);

  const triggerHaptic = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const pickNationality = useCallback(async (nat: Nationality) => {
    await triggerHaptic();
    setSelectedNationality(nat);
    setNationalityId(nat.id);
    setStep('culture');
    setSelectedCultureIds([]);
  }, [setNationalityId, triggerHaptic]);

  const toggleCulture = useCallback(async (culture: Culture) => {
    await triggerHaptic();
    setSelectedCultureIds((prev) => prev.includes(culture.id) ? prev.filter((id) => id !== culture.id) : [...prev, culture.id]);
    // Picking a root culture removes it from the explorer pool — you cannot
    // "explore" your own roots.
    setSelectedExploringCultureIds((prev) => prev.filter((id) => id !== culture.id));
  }, [triggerHaptic]);

  const toggleExploringCulture = useCallback(async (culture: Culture) => {
    await triggerHaptic();
    setSelectedExploringCultureIds((prev) =>
      prev.includes(culture.id) ? prev.filter((id) => id !== culture.id) : [...prev, culture.id],
    );
  }, [triggerHaptic]);

  const toggleLanguage = useCallback(async (lang: Language) => {
    await triggerHaptic();
    setSelectedLanguageIds((prev) => prev.includes(lang.id) ? prev.filter((id) => id !== lang.id) : [...prev, lang.id]);
  }, [triggerHaptic]);

  const removeLanguage = useCallback(async (langId: string) => {
    await triggerHaptic();
    setSelectedLanguageIds((prev) => prev.filter((id) => id !== langId));
  }, [triggerHaptic]);

  const goBack = useCallback(async () => {
    await triggerHaptic();
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      setStep(STEP_ORDER[idx - 1]);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(routeWithRedirect('/(onboarding)/communities', redirectTo) as string);
    }
  }, [step, redirectTo, triggerHaptic]);

  const persistAllSelections = useCallback(() => {
    setCultureIds(selectedCultureIds);
    // Filter exploring against root again, defensively.
    const exploring = selectedExploringCultureIds.filter((id) => !selectedCultureIds.includes(id));
    setExploringCultureIds(exploring);
    setLanguageIds(selectedLanguageIds);

    const diasporaGroups = selectedNationality
      ? getDiasporaGroupsForNationality(selectedNationality.id).map((g) => g.id)
      : [];
    setDiasporaGroupIds(diasporaGroups);

    setEthnicityText(selectedNationality?.label ?? '');
    setLanguages(selectedLanguageObjects.map((l) => l.name));
  }, [
    selectedCultureIds,
    selectedExploringCultureIds,
    selectedLanguageIds,
    selectedNationality,
    selectedLanguageObjects,
    setCultureIds,
    setExploringCultureIds,
    setLanguageIds,
    setDiasporaGroupIds,
    setEthnicityText,
    setLanguages,
  ]);

  const goNext = useCallback(async () => {
    await triggerHaptic();
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
      return;
    }
    persistAllSelections();
    router.push(routeWithRedirect('/(onboarding)/interests', redirectTo) as string);
  }, [step, persistAllSelections, redirectTo, triggerHaptic]);

  const skipStep = useCallback(async () => {
    await triggerHaptic();
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
      return;
    }
    // User skipped past all culture steps — mark 'cultures' as skipped for the banner (Req 2.3)
    skipOnboardingStep('cultures').catch(() => {});
    persistAllSelections();
    router.push(routeWithRedirect('/(onboarding)/interests', redirectTo) as string);
  }, [step, persistAllSelections, redirectTo, triggerHaptic, skipOnboardingStep]);

  const stepIndex = STEP_ORDER.indexOf(step);
  const stepCount = STEP_ORDER.length;
  const canProceed =
    step === 'nationality'
      ? !!selectedNationality
      : step === 'culture'
        ? selectedCultureIds.length > 0
        : step === 'exploring'
          ? true /* exploring is optional */
          : selectedLanguageIds.length > 0;

  return {
    step,
    setStep,
    stepIndex,
    stepCount,
    canProceed,
    nationalityQuery, setNationalityQuery,
    cultureQuery, setCultureQuery,
    exploringQuery, setExploringQuery,
    languageQuery, setLanguageQuery,
    selectedNationality,
    selectedCultureIds,
    selectedExploringCultureIds,
    selectedLanguageIds,
    filteredNationalities,
    availableCultures,
    filteredCultures,
    filteredExploringCultures,
    filteredLanguages,
    selectedLanguageObjects,
    pickNationality,
    toggleCulture,
    toggleExploringCulture,
    toggleLanguage,
    removeLanguage,
    goBack,
    goNext,
    skipStep,
  };
}
