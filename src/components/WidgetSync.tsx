import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { syncCultureWidgetSnapshots } from '@/lib/widgets/sync';
import { fetchWidgetSyncData } from '@/components/widgets/services/widgetService';

export function WidgetSync() {
  const { user, isAuthenticated } = useAuth();
  const { state: onboarding } = useOnboarding();

  const city = user?.city ?? onboarding.city ?? undefined;
  const country = user?.country ?? onboarding.country ?? undefined;

  const { data } = useQuery({
    queryKey: ['widget-sync', user?.id, city, country],
    queryFn: () => fetchWidgetSyncData({ city, country, userId: user?.id, isAuthenticated }),
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = user?.displayName || user?.username;
  const culturePassId = user?.culturePassId ?? user?.id;
  const userId = user?.id;

  useEffect(() => {
    if (!city || !data) return;

    syncCultureWidgetSnapshots({
      spotlight: data.spotlight,
      nearby: data.nearby,
      upcomingTicket: data.upcomingTicket,
      displayName,
      culturePassId,
      city,
      country,
    });
  }, [data, userId, displayName, culturePassId, city, country]);

  return null;
}
