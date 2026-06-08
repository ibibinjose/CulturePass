/**
 * Monetization surfaces tied to the creation funnel.
 * Analytics + future Stripe/feature-gate hooks — no DB migration required.
 */

import type { CreationLayer , HostspaceManageTab } from './dataflow';

export type MonetizationSurface =
  | 'featured_listing'
  | 'verified_badge'
  | 'ticket_commission'
  | 'culture_market_fee'
  | 'host_membership'
  | 'offer_boost';

export interface MonetizationOpportunity {
  surface: MonetizationSurface;
  label: string;
  /** When to show upsell in the create/publish funnel */
  trigger: 'publish' | 'verify' | 'first_sale' | 'high_traffic';
  layers: CreationLayer[];
  manageTabs: HostspaceManageTab[];
}

/** Surfaces we can attach to creation analytics today; Stripe wiring comes later. */
export const CREATION_MONETIZATION_SURFACES: MonetizationOpportunity[] = [
  {
    surface: 'verified_badge',
    label: 'Verified host badge',
    trigger: 'verify',
    layers: ['owner'],
    manageTabs: ['pages', 'listings'],
  },
  {
    surface: 'featured_listing',
    label: 'Featured directory placement',
    trigger: 'publish',
    layers: ['content', 'owner'],
    manageTabs: ['listings', 'events', 'offers'],
  },
  {
    surface: 'ticket_commission',
    label: 'Ticket sales commission',
    trigger: 'first_sale',
    layers: ['content'],
    manageTabs: ['events'],
  },
  {
    surface: 'culture_market_fee',
    label: 'CultureMarket transaction fee',
    trigger: 'first_sale',
    layers: ['market'],
    manageTabs: ['market'],
  },
  {
    surface: 'offer_boost',
    label: 'Boosted offer placement',
    trigger: 'publish',
    layers: ['content'],
    manageTabs: ['offers'],
  },
  {
    surface: 'host_membership',
    label: 'Paid community membership',
    trigger: 'publish',
    layers: ['owner'],
    manageTabs: ['pages'],
  },
];

export function monetizationSurfacesForLayer(layer: CreationLayer): MonetizationOpportunity[] {
  return CREATION_MONETIZATION_SURFACES.filter((s) => s.layers.includes(layer));
}

export function monetizationSurfacesForManageTab(tab: HostspaceManageTab): MonetizationOpportunity[] {
  if (tab === 'all') return CREATION_MONETIZATION_SURFACES;
  return CREATION_MONETIZATION_SURFACES.filter((s) => s.manageTabs.includes(tab));
}