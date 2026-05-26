import { Stack, Redirect } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/design-system/tokens/theme';



export default function OnboardingLayout() {
  const colors = useColors();
  const { state, isLoading } = useOnboarding();
  const { userId } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loadRoot, { backgroundColor: colors.background }]} accessibilityLabel="Loading onboarding">
        <View style={[styles.loadPanel, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <ActivityIndicator size="large" color={CultureTokens.gold} accessibilityLabel="Loading" />
        </View>
      </View>
    );
  }

  if (userId && state.isComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>

      <Stack screenOptions={{ headerShown: false, animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="location" />
        <Stack.Screen name="communities" />
        <Stack.Screen name="culture-match" />
        <Stack.Screen name="interests" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadPanel: {
    minWidth: 120,
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 32,
  },
});
