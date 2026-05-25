/**
 * Legacy `/create/*` shell — thin redirects into the canonical Creation Lab (`/hostspace/create`).
 */
import { Stack } from 'expo-router';
import { NavigationMetadata } from '@/components/NavigationMetadata';

export default function CreateLegacyLayout() {
  return (
    <>
      <NavigationMetadata />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="hub" />
        <Stack.Screen name="[type]" />
      </Stack>
    </>
  );
}
