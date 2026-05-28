/**
 * Location-related types for the CulturePass application
 */

export interface AustralianState {
  code: string;
  name: string;
  emoji?: string;
}

export interface AustralianCity {
  name: string;
  stateCode: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
}