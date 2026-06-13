/**
 * Daily Eventbrite Australia import — syncs eventbrite.com.au listings into the
 * Australian Event Finder community hub on CulturePass.
 */

import { scheduler } from 'firebase-functions/v2';
import { syncEventbriteEvents } from '../services/eventbriteSync';

const REGION = 'australia-southeast1';

/** Runs daily at 05:00 Australia/Sydney (after Eventik sync). */
export const syncEventbriteDaily = scheduler.onSchedule(
  {
    schedule: '0 5 * * *',
    timeZone: 'Australia/Sydney',
    region: REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    try {
      const result = await syncEventbriteEvents();
      console.log('[eventbriteSync] completed', JSON.stringify(result));
      if (result.errors.length > 0 && result.upserted === 0) {
        throw new Error(result.errors.join('; '));
      }
    } catch (err) {
      console.error('[eventbriteSync] failed', err);
      throw err;
    }
  },
);