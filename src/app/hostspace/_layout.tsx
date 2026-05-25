/**
 * Hostspace layout — Stack for all /hostspace/* routes.
 *
 * Auth + role gating is handled per-screen:
 *  - index.tsx          → HostspaceAccessGate (signed-in + organizer)
 *  - create/*           → HostspaceAccessGate (same; blocks anonymous browsing)
 *  - apply.tsx          → always accessible (it IS the path to become a host)
 *  - dashboard/index    → protected by HostspaceCreateWorkspace
 */
import { Stack } from 'expo-router';
import { NavigationMetadata } from '@/components/NavigationMetadata';

export default function HostspaceLayout() {
  return (
    <>
      <NavigationMetadata />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="apply" />
        <Stack.Screen name="create" />
        <Stack.Screen name="dashboard/index" />
      </Stack>
    </>
  );
}
