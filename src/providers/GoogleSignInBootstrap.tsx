import { useEffect } from 'react';
import { Platform } from 'react-native';
import { ensureGoogleSignInConfigured } from '@/lib/social-auth';

/**
 * Eagerly configures @react-native-google-signin/google-signin on native platforms
 * so the first tap on a social button does not pay configure latency.
 */
export function GoogleSignInBootstrap() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    ensureGoogleSignInConfigured().catch(() => {
      /* misconfigured env — sign-in handlers surface a user-visible error */
    });
  }, []);

  return null;
}