/**
 * Admin Verification Layout
 * =========================
 * Stack layout for verification queue and task detail screens.
 */
import { Stack } from 'expo-router';

export default function VerificationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[taskId]" />
    </Stack>
  );
}
