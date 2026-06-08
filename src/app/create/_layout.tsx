/**
 * Legacy `/create/*` shell — thin redirects into the canonical Creation Lab (`/pages/create`).
 */
import { Stack } from 'expo-router';


export default function CreateLegacyLayout() {
  return (
    <>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="hub" />
        <Stack.Screen name="[type]" />
      </Stack>
    </>
  );
}
