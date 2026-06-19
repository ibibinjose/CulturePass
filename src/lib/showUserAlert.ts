import { Alert, Platform } from 'react-native';

/** Cross-platform alert — React Native Alert is unreliable on web. */
export function showUserAlert(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}