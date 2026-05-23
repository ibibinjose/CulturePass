import type { ApiRequestFn } from '../client';

export interface AustralianState {
  name: string;
  code: string;
  emoji: string;
  cities: string[];
}

export interface LocationEntry {
  country: string;
  countryCode: string;
  states: AustralianState[];
  cities: string[];
}

export interface LocationsResponse {
  locations: LocationEntry[];
  acknowledgementOfCountry: string;
}

export function createLocationsNamespace(request: ApiRequestFn) {
  return {
    /** Fetch all location data (states + cities). Cache-first on backend (30 min TTL). */
    list: () => request<LocationsResponse>('GET', 'api/locations'),

    /**
     * Google Places autocomplete (proxied via backend to keep API key secure).
     * POST /api/locations/autocomplete
     */
    autocomplete: (params: { input: string; country?: string }) =>
      request<{
        predictions: Array<{
          place_id: string;
          description: string;
          structured_formatting: { main_text: string; secondary_text: string };
        }>;
      }>('POST', 'api/locations/autocomplete', params),

    /**
     * Geocode a Google Place ID to get full address details and coordinates.
     * POST /api/locations/geocode
     */
    geocode: (params: { placeId: string }) =>
      request<{
        street: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        latitude: number;
        longitude: number;
        lgaCode?: string;
        placeId: string;
      }>('POST', 'api/locations/geocode', params),
  };
}
