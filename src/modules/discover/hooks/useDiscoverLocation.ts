/**
 * @deprecated Prefer `useLocation()` from `@/contexts/LocationContext`.
 * Kept for discover module imports — delegates to app-wide location context.
 */
import { useLocation, type AppLocation } from '@/contexts/LocationContext';

export type DiscoverLocationStatus = AppLocation['status'];
export type DiscoverLocationSource = AppLocation['source'];
export type DiscoverLocation = AppLocation;

export function useDiscoverLocation(): DiscoverLocation {
  return useLocation();
}