import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { interestCategories, type InterestCategory } from '@/constants/onboardingInterests';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import type { User } from '@/shared/schema';

const MIN_REQUIRED = 5;
const INITIALLY_OPEN = new Set(['cultural', 'arts']);

export function useInterestsSelection() {
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { user } = useAuth();
  const { state, setInterests: setSelectedInterests, completeOnboarding } = useOnboarding();

  const [selected, setSelected] = useState<string[]>(state.interests || []);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(interestCategories.map(c => [c.id, INITIALLY_OPEN.has(c.id)]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryByInterest = useMemo(() => {
    const map = new Map<string, InterestCategory>();
    for (const cat of interestCategories) {
      for (const interest of cat.interests) map.set(interest, cat);
    }
    return map;
  }, []);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = async (interest: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleAll = async (category: InterestCategory) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allSelected = category.interests.every(i => selectedSet.has(i));
    if (allSelected) {
      setSelected(prev => prev.filter(i => !category.interests.includes(i)));
    } else {
      setSelected(prev => [...new Set([...prev, ...category.interests])]);
    }
  };

  const toggleSection = async (categoryId: string) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setExpanded(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleFinish = async () => {
    if (selected.length < MIN_REQUIRED) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSelectedInterests(selected);

    if (user?.id) {
      const selectedCategoryIds = [...new Set(
        selected
          .map(interest => categoryByInterest.get(interest)?.id)
          .filter((id): id is string => Boolean(id)),
      )];
      const profilePayload: Partial<User> & {
        languages?: string[];
        ethnicityText?: string;
        communities?: string[];
        interestCategoryIds?: string[];
      } = {
        city: state.city || undefined,
        country: state.country || undefined,
        communities: state.communities,
        interests: selected,
        interestCategoryIds: selectedCategoryIds,
        languages: state.languages,
        ethnicityText: state.ethnicityText || undefined,
        culturalIdentity: {
          nationalityId: state.nationalityId || undefined,
          cultureIds: state.cultureIds.length > 0 ? state.cultureIds : undefined,
          languageIds: state.languageIds.length > 0 ? state.languageIds : undefined,
          diasporaGroupIds: state.diasporaGroupIds.length > 0 ? state.diasporaGroupIds : undefined,
          exploringCultureIds:
            state.exploringCultureIds.length > 0 ? state.exploringCultureIds : undefined,
          exploringCultureTags:
            state.exploringCultureIds.length > 0
              ? state.exploringCultureIds.map((id) => id.toLowerCase())
              : undefined,
        },
      };
      try { await api.users.update(user.id, profilePayload); } catch { /* non-fatal */ }
    }

    try {
      await completeOnboarding();
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(routeWithRedirect('/pages/create', redirectTo) as string);
      return { success: true };
    } catch (error) {
      if (__DEV__) console.warn('[onboarding] failed to complete onboarding:', error);
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsSubmitting(false);
      return { success: false, error };
    }
  };

  const isReady = selected.length >= MIN_REQUIRED;
  const remaining = MIN_REQUIRED - selected.length;

  return {
    selected,
    expanded,
    isSubmitting,
    selectedSet,
    categoryByInterest,
    isReady,
    remaining,
    MIN_REQUIRED,
    toggle,
    toggleAll,
    toggleSection,
    handleFinish
  };
}
