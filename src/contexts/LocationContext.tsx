import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { acquireDeviceLocation } from '@/lib/location/acquireDeviceLocation';
import { resolveEffectivePlace } from '@/lib/location/effectiveLocation';
import { getLocaleForCountry } from '@/lib/dateUtils';
import type { CouncilData } from '@/shared/schema';
import type { CouncilConfidence, CouncilMatchMethod } from '@/hooks/useNearestCouncil';

export type LocationStatus = 'idle' | 'detecting' | 'ready' | 'denied' | 'unavailable' | 'error';
export type LocationSource = 'gps' | 'onboarding' | 'hybrid';

export type AppLocation = {
  status: LocationStatus;
  source: LocationSource;
  coordinates: { latitude: number; longitude: number } | null;
  city: string;
  state?: string;
  country: string;
  suburb?: string;
  displayLabel: string;
  dateLabel: string;
  timeLabel: string;
  dateTimeLabel: string;
  council: CouncilData | null;
  councilDistanceKm: number | null;
  councilMatchMethod: CouncilMatchMethod;
  councilConfidence: CouncilConfidence;
  isGps: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

const LocationContext = createContext<AppLocation | undefined>(undefined);

function buildDisplayLabel(parts: {
  suburb?: string;
  city: string;
  state?: string;
  isGps: boolean;
}): string {
  const city = parts.city.trim();
  const suburb = parts.suburb?.trim();
  const state = parts.state?.trim();

  if (suburb && city && suburb.toLowerCase() !== city.toLowerCase()) {
    const base = `${suburb}, ${city}`;
    return state ? `${base}, ${state}` : base;
  }
  if (city) {
    return state ? `${city}, ${state}` : city;
  }
  return parts.isGps ? 'your area' : 'Australia';
}

function formatLocalDateTime(country: string): {
  dateLabel: string;
  timeLabel: string;
  dateTimeLabel: string;
} {
  const now = new Date();
  const locale = getLocaleForCountry(country);
  const dateLabel = now.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeLabel = now.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const shortDate = now.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return { dateLabel, timeLabel, dateTimeLabel: `${shortDate} · ${timeLabel}` };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { state: onboarding, setCouncil: persistCouncil } = useOnboarding();
  const { user } = useAuth();

  const [status, setStatus] = useState<LocationStatus>('idle');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsCity, setGpsCity] = useState<string | undefined>();
  const [gpsSuburb, setGpsSuburb] = useState<string | undefined>();
  const [gpsState, setGpsState] = useState<string | undefined>();
  const [gpsCountry, setGpsCountry] = useState<string | undefined>();
  const [council, setCouncil] = useState<CouncilData | null>(null);
  const [councilDistanceKm, setCouncilDistanceKm] = useState<number | null>(null);
  const [councilMatchMethod, setCouncilMatchMethod] = useState<CouncilMatchMethod>('none');
  const [councilConfidence, setCouncilConfidence] = useState<CouncilConfidence>('weak');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(0);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setClockTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const onboardingCity = onboarding.city?.trim() || '';
  const onboardingCountry = onboarding.country?.trim() || 'Australia';

  const detect = useCallback(async () => {
    if (!mounted.current) return;
    setStatus('detecting');
    setErrorMessage(null);

    const device = await acquireDeviceLocation();
    if (!mounted.current) return;

    if (!device.ok) {
      const msg =
        device.reason === 'denied'
          ? 'Location permission denied — using your saved city.'
          : device.reason === 'unavailable'
            ? 'Location services off — using your saved city.'
            : 'Could not read GPS — using your saved city.';
      setStatus(device.reason);
      setErrorMessage(msg);
      setCoordinates(null);
      setGpsCity(undefined);
      setGpsSuburb(undefined);
      setGpsState(undefined);
      setGpsCountry(undefined);
      setCouncil(null);
      setCouncilDistanceKm(null);
      setCouncilMatchMethod('none');
      setCouncilConfidence('weak');
      return;
    }

    setCoordinates({ latitude: device.latitude, longitude: device.longitude });
    setGpsCity(device.city);
    setGpsSuburb(device.suburb);
    setGpsState(device.state);
    setGpsCountry(device.country);

    try {
      const councilResult = await api.council.nearest({
        latitude: device.latitude,
        longitude: device.longitude,
        city: device.city ?? (onboardingCity || undefined),
        state: device.state,
        country: device.country ?? onboardingCountry,
      });

      if (!mounted.current) return;

      if (councilResult?.council) {
        setCouncil(councilResult.council);
        setCouncilDistanceKm(councilResult.distanceKm ?? null);
        setCouncilMatchMethod(councilResult.matchMethod ?? 'coordinate');
        setCouncilConfidence(councilResult.confidence ?? 'medium');

        const nextId = councilResult.council.id;
        const nextLga = councilResult.council.lgaCode ?? '';
        if (nextId && (onboarding.councilId !== nextId || onboarding.lgaCode !== nextLga)) {
          persistCouncil(nextId, nextLga || undefined);
        }
      } else {
        setCouncil(null);
        setCouncilDistanceKm(null);
        setCouncilMatchMethod('none');
        setCouncilConfidence('weak');
      }
    } catch {
      if (!mounted.current) return;
      setCouncil(null);
      setCouncilDistanceKm(null);
      setCouncilMatchMethod('none');
      setCouncilConfidence('weak');
    }

    setStatus('ready');
  }, [onboardingCity, onboardingCountry, onboarding.councilId, onboarding.lgaCode, persistCouncil]);

  useEffect(() => {
    void detect();
  }, [detect]);

  const isGps = coordinates != null && status === 'ready';
  const effective = resolveEffectivePlace({
    hasGps: isGps,
    gpsCity,
    gpsCountry,
    gpsState,
    onboardingCity,
    onboardingCountry,
    userCity: user?.city,
    userCountry: user?.country,
  });

  const source: LocationSource = isGps
    ? onboardingCity && gpsCity && onboardingCity.toLowerCase() !== gpsCity.toLowerCase()
      ? 'hybrid'
      : 'gps'
    : 'onboarding';

  const displayLabel = useMemo(() => {
    if (status === 'detecting') return 'Finding your location…';
    return buildDisplayLabel({
      suburb: gpsSuburb,
      city: effective.city,
      state: effective.state,
      isGps,
    });
  }, [status, gpsSuburb, effective.city, effective.state, isGps]);

  const { dateLabel, timeLabel, dateTimeLabel } = useMemo(
    () => formatLocalDateTime(effective.country),
    [effective.country, clockTick],
  );

  const value = useMemo<AppLocation>(
    () => ({
      status,
      source,
      coordinates,
      city: effective.city,
      state: effective.state,
      country: effective.country,
      suburb: gpsSuburb,
      displayLabel,
      dateLabel,
      timeLabel,
      dateTimeLabel,
      council,
      councilDistanceKm,
      councilMatchMethod,
      councilConfidence,
      isGps,
      errorMessage,
      refresh: detect,
    }),
    [
      status,
      source,
      coordinates,
      effective.city,
      effective.state,
      effective.country,
      gpsSuburb,
      displayLabel,
      dateLabel,
      timeLabel,
      dateTimeLabel,
      council,
      councilDistanceKm,
      councilMatchMethod,
      councilConfidence,
      isGps,
      errorMessage,
      detect,
    ],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): AppLocation {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return ctx;
}

/** Safe outside LocationProvider — returns onboarding-only fallback. */
export function useLocationOptional(): AppLocation | null {
  return useContext(LocationContext) ?? null;
}