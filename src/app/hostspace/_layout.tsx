/**
 * Hostspace layout — Stack for all /hostspace/* routes.
 *
 * Auth + role gating is handled per-screen:
 *  - index.tsx          → HostspaceAccessGate (signed-in + organizer)
 *  - create/*           → HostspaceAccessGate (same; blocks anonymous browsing)
 *  - dashboard/index    → protected by HostspaceCreateWorkspace
 *
 * Note: The old /hostspace/apply flow was fully consolidated into /hostspace/create.
 */
import { Stack } from 'expo-router';


export default function HostspaceLayout() {
  return (
    <>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create" />
        <Stack.Screen name="dashboard/index" />
      </Stack>
    </>
  );
}
