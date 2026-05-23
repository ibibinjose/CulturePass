import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const HapticManager = {
  /**
   * For light navigation, small toggles, or minor interactions.
   */
  light: async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * For standard button presses, form submissions, or important actions.
   */
  medium: async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * For heavy, critical actions like destructive deletes or major transformations.
   */
  heavy: async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * For successful completions (e.g., ticket purchased, profile saved).
   */
  success: async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * For warnings or destructive confirmations.
   */
  warning: async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * For validation errors, failed API calls, or blocked actions.
   */
  error: async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
