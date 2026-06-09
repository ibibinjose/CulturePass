import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';
import { SocialButton } from '@/design-system/ui';
import { Spacing } from '@/design-system/tokens/theme';
import { isAppleSignInSupported } from '@/lib/social-auth';

type AuthSocialSectionProps = {
  onGooglePress: () => void;
  onApplePress: () => void;
  loading?: boolean;
  entering?: AnimatedProps<typeof Animated.View>['entering'];
  mode?: 'login' | 'signup';
};

export function AuthSocialSection({
  onGooglePress,
  onApplePress,
  loading = false,
  entering,
  mode = 'login',
}: AuthSocialSectionProps) {
  const appleSupported = isAppleSignInSupported();
  const verb = mode === 'signup' ? 'Sign up' : 'Continue';

  return (
    <Animated.View entering={entering} style={styles.socialStack}>
      <SocialButton
        provider="google"
        onPress={onGooglePress}
        disabled={loading}
        fullWidth
        accessibilityLabel={`${verb} with Google`}
      />
      {appleSupported ? (
        <SocialButton
          provider="apple"
          onPress={onApplePress}
          disabled={loading}
          fullWidth
          accessibilityLabel={`${verb} with Apple`}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  socialStack: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: Spacing.lg,
    width: '100%',
  },
});