import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CultureDestinationScreen } from '@/components/culture/CultureDestinationScreen';
import { CULTURE_DESTINATIONS } from '@/constants/cultureDestinations';

export default function KeralaLandingScreen() {
  const params = useLocalSearchParams();
  return (
    <CultureDestinationScreen
      definition={CULTURE_DESTINATIONS.kerala}
      routeSearchParams={params as Record<string, string | string[] | undefined>}
    />
  );
}
