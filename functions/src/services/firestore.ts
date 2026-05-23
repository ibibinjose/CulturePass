/**
 * Firestore Service facade — CulturePass
 *
 * Central re-exporting barrel for all modularised Firestore services.
 * Handlers import from this file; individual service files contain the implementations.
 */

export * from './base';
export * from './users';
export * from './events';
export * from './tickets';
export * from './profiles';
export * from './wallets';
export * from './notifications';
export * from './perks';
export * from './activities';
export * from './search';
export * from './misc';
