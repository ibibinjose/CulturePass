/**
 * Hostspace layout — Stack for all /hostspace/* routes.
 *
 * Auth + role gating is handled per-screen:
 *  - index.tsx          → HostspaceAccessGate (signed-in + organizer)
 *  - create             → create catalog
 *  - [category]/create  → category wizards
 *  - event/create       → event wizard
 *  - listing            → CultureMarket wizard
 *  - dashboard/index    → host analytics
 *
 * All hosting (manage + create) lives on /hostspace — no separate workspace route.
 */
import { Stack } from 'expo-router';


export default function HostspaceLayout() {
  return (
    <>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create" />
        <Stack.Screen name="event/create" />
        <Stack.Screen name="[category]/create" />
        <Stack.Screen name="listing" />
        <Stack.Screen name="dashboard/index" />
      </Stack>
    </>
  );
}
