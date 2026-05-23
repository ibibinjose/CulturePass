import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { api, type CouncilLgaContext } from '@/lib/api';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';

function buildCouncilParams(city?: string, country?: string) {
  const fallbackPostcode = city ? getPostcodesByPlace(city)[0] : undefined;
  return {
    city: city || undefined,
    country: country || 'Australia',
    postcode: fallbackPostcode?.postcode,
    suburb: fallbackPostcode?.place_name,
    state: fallbackPostcode?.state_code,
  };
}

function isAustralia(country?: string): boolean {
  const c = String(country ?? '').trim().toLowerCase();
  return c === 'australia' || c === 'au' || c === '';
}

/**
 * Signed-in user’s LGA (council) context for discover, calendar, and proximity rails.
 * Guests in Australia: resolves council from onboarding city via public `/council/resolve`.
 * Council is a location dimension only — no follow/preferences/waste APIs.
 */
export function useCouncil() {
  const queryClient = useQueryClient();
  const { state } = useOnboarding();
  const { isAuthenticated } = useAuth();

  const councilParams = useMemo(
    () => buildCouncilParams(state.city, state.country),
    [state.city, state.country],
  );

  const canResolveGuest = !isAuthenticated && isAustralia(state.country) && Boolean(state.city?.trim());

  const queryKey = [
    '/api/council/context',
    isAuthenticated ? 'my' : 'resolve',
    councilParams.city,
    councilParams.postcode,
    councilParams.state,
  ] as const;

  const { data, isLoading, isError, refetch } = useQuery<CouncilLgaContext | null>({
    queryKey,
    queryFn: async () => {
      if (isAuthenticated) {
        return api.council.my(councilParams);
      }
      if (canResolveGuest) {
        return api.council.resolve({
          city: councilParams.city,
          state: councilParams.state,
          country: councilParams.country,
        });
      }
      return null;
    },
    enabled: isAuthenticated || canResolveGuest,
  });

  const council = data?.council ?? null;
  const councilId = council?.id;
  const lgaCode = council?.lgaCode;

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/council/context'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/council/my'] });
  };

  return {
    data,
    council,
    councilId,
    lgaCode,
    isLoading,
    isError,
    isAuthenticated,
    refetch,
    reload,
  };
}
