/**
 * CulturePass — Firebase Cloud Functions entry point
 *
 * Mounts the entire Express app as a single Cloud Function named `api`.
 * All routes are reachable at:
 *   https://us-central1-<project>.cloudfunctions.net/api/<route>
 *   or via Firebase Hosting rewrite: /api/** → api function
 */

import { https, setGlobalOptions } from 'firebase-functions/v2';
import { app } from './app';

// Ensure all v2 functions run in the same region as Firestore
setGlobalOptions({ region: 'australia-southeast1' });

// Export the API function using the v2 HTTPS function API
export const api = https.onRequest(app);

export * from './triggers';
export * from './payments/stripeCheckout';
