import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function DomainLayout() {
  // Critical web guard against "state.routes.filter" / "Platform is not defined" crashes.
  //
  // On web, during hydration or when first mounting a nested Stack (the (domain) group),
  // the navigation state can be undefined for a moment. React Navigation then blows up
  // internally when it tries to do state.routes.filter(...).
  //
  // We delay mounting the actual Stack by one animation frame on web.
  // This pattern has been the most reliable fix across multiple route/layout refactors.
  const [isNavigatorReady, setIsNavigatorReady] = React.useState(() => Platform.OS !== 'web');

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const raf = requestAnimationFrame(() => setIsNavigatorReady(true));
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  if (!isNavigatorReady) {
    return null; // Prevent the navigator from ever seeing a bad state
  }

  // Keep the Stack minimal — all domain screens render their own headers.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Fade for canonical detail pages */}
      <Stack.Screen name="community/[id]" options={{ animation: 'fade' }} />
      <Stack.Screen name="community/[id]/members" options={{ animation: 'fade' }} />
      <Stack.Screen name="event/[id]" options={{ animation: 'fade' }} />
      <Stack.Screen name="culturehub/index" options={{ animation: 'fade' }} />
      <Stack.Screen name="culturehub/[slug]" options={{ animation: 'fade' }} />
    </Stack>
  );
}
