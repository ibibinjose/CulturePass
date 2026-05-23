import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function initializeWidgets(): void {
  if (Platform.OS === 'web') return;
  if (Constants.executionEnvironment === 'storeClient') return;

  try {
    // Side-effect import registers widget and Live Activity layouts.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/widgets');
  } catch (error) {
    // Expo Go doesn't include ExpoUI native modules required by widget files.
    // Fail open so the rest of the app can boot normally.
    if (__DEV__) {
      console.warn('[widgets] Widget module unavailable in this runtime:', error);
    }
  }
}
