import { useEffect, useMemo, useState } from 'react';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import type { DiscoverLocation } from './useDiscoverLocation';

async function fetchWeather(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { current_weather?: { temperature: number; weathercode: number } };
    return data.current_weather ?? null;
  } catch {
    return null;
  }
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Showers';
  return 'Stormy';
}

export function cityToCoordinates(city?: string): { latitude: number; longitude: number } | null {
  if (!city) return null;
  const match = getPostcodesByPlace(city)[0];
  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude };
}

export function useDiscoverServiceState(location: DiscoverLocation) {
  const [weatherSummary, setWeatherSummary] = useState('');

  const coords = useMemo(() => {
    if (location.coordinates) return location.coordinates;
    return cityToCoordinates(location.city);
  }, [location.coordinates, location.city]);

  useEffect(() => {
    if (!coords) {
      setWeatherSummary('');
      return;
    }

    let cancelled = false;
    fetchWeather(coords.latitude, coords.longitude)
      .then((w) => {
        if (cancelled || !w) return;
        setWeatherSummary(`${Math.round(w.temperature)}°C ${weatherLabel(w.weathercode)}`);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [coords?.latitude, coords?.longitude]);

  return {
    currentTime: location.dateTimeLabel,
    dateLabel: location.dateLabel,
    timeLabel: location.timeLabel,
    weatherSummary,
    selectedCityCoordinates: coords,
    locationDisplayLabel: location.displayLabel,
  };
}