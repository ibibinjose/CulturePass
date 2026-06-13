/**
 * Daily Eventik import — syncs eventik.com.au listings into the Australian Indian
 * Events community hub on CulturePass.
 */

import { scheduler } from 'firebase-functions/v2';
import { syncEventikEvents } from '../services/eventikSync';

const REGION = 'australia-southeast1';

/** Runs daily at 04:00 Australia/Sydney */
export const syncEventikDaily = scheduler.onSchedule(
  {
    schedule: '0 4 * * *',
    timeZone: 'Australia/Sydney',
    region: REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    try {
      const result = await syncEventikEvents();
      console.log('[eventikSync] completed', JSON.stringify(result));
    } catch (err) {
      console.error('[eventikSync] failed', err);
      throw err;
    }
  },
);