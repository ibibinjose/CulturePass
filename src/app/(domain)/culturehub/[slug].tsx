import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { CultureDestinationScreen } from '@/components/culture/CultureDestinationScreen';
import { getCultureDestination } from '@/constants/cultureDestinations';

export default function CultureSlugScreen() {
  const params = useLocalSearchParams<{
    slug: string;
    country?: string;
    scope?: string;
    state?: string;
  }>();
  const { slug, ...rest } = params;
  const key = Array.isArray(slug) ? slug[0] : slug;
  const def = key ? getCultureDestination(key.toLowerCase()) : null;
  if (!def) {
    return <Redirect href="/+not-found" />;
  }
  return <CultureDestinationScreen definition={def} routeSearchParams={rest} />;
}
