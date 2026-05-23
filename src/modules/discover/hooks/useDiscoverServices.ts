import { useEffect, useMemo, useState } from 'react';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Sydney: { lat: -33.8688, lon: 151.2093 },
  Melbourne: { lat: -37.8136, lon: 144.9631 },
  Brisbane: { lat: -27.4698, lon: 153.0251 },
  Perth: { lat: -31.9505, lon: 115.8605 },
  Adelaide: { lat: -34.9285, lon: 138.6007 },
  'Gold Coast': { lat: -28.0167, lon: 153.4 },
  Canberra: { lat: -35.2809, lon: 149.13 },
  Hobart: { lat: -42.8821, lon: 147.3272 },
};

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

export function cityToCoordinates(city?: string): { latitude: number; longitude: number } | null {
  if (!city) return null;
  const match = getPostcodesByPlace(city)[0];
  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude };
}

export function useDiscoverServiceState(cityFromOnboarding?: string) {
  const [currentTime, setCurrentTime] = useState('');
  const [weatherSummary, setWeatherSummary] = useState('');

  const city = cityFromOnboarding || 'Sydney';
  const coords = CITY_COORDS[city] || CITY_COORDS.Sydney;

  useEffect(() => {
    function updateTime() {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchWeather(coords.lat, coords.lon)
      .then((w) => {
        if (cancelled || !w) return;
        const condition =
          w.weathercode === 0
            ? 'Clear'
            : w.weathercode <= 3
              ? 'Partly Cloudy'
              : w.weathercode <= 49
                ? 'Foggy'
                : w.weathercode <= 67
                  ? 'Rainy'
                  : w.weathercode <= 77
                    ? 'Snowy'
                    : w.weathercode <= 82
                      ? 'Showers'
                      : 'Stormy';
        setWeatherSummary(`${Math.round(w.temperature)}°C ${condition}`);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon]);

  const selectedCityCoordinates = useMemo(
    () => cityToCoordinates(cityFromOnboarding),
    [cityFromOnboarding],
  );

  return {
    currentTime,
    weatherSummary,
    selectedCityCoordinates,
  };
}
