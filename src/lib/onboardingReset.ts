import { Platform, Alert } from 'react-native';
import type { User } from '@/shared/schema';

export const ONBOARDING_PROFILE_CLEAR_PATCH: Partial<User> & {
  culturalIdentity?: Record<string, never>;
} = {
  city: '',
  country: '',
  interests: [],
  communities: [],
  interestCategoryIds: [],
  languages: [],
  ethnicityText: '',
  lgaCode: '',
  councilId: '',
  culturalIdentity: {},
};

export async function confirmOnboardingRestart(): Promise<boolean> {
  const message =
    'Start onboarding over? Your location, communities, culture match, and interests will be cleared.';
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(message);
    }
    return true;
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert('Restart onboarding', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Restart', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}