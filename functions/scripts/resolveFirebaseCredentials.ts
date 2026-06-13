/**
 * Resolve Firestore credentials for local scripts without requiring
 * a separate `gcloud auth application-default login`.
 *
 * Priority:
 *  1. GOOGLE_APPLICATION_CREDENTIALS (if file exists)
 *  2. ~/.config/firebase/*_application_default_credentials.json (from `firebase login`)
 *  3. ~/.config/gcloud/application_default_credentials.json (from gcloud ADC)
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function findFirebaseLoginAdcPath(): string | null {
  const dir = join(homedir(), '.config', 'firebase');
  if (!existsSync(dir)) return null;
  const match = readdirSync(dir).find((name) => name.endsWith('_application_default_credentials.json'));
  return match ? join(dir, match) : null;
}

export function resolveGoogleApplicationCredentials(): string {
  const existing = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (existing && existsSync(existing)) {
    return existing;
  }

  const firebaseAdc = findFirebaseLoginAdcPath();
  if (firebaseAdc) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = firebaseAdc;
    return firebaseAdc;
  }

  const gcloudAdc = join(homedir(), '.config', 'gcloud', 'application_default_credentials.json');
  if (existsSync(gcloudAdc)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = gcloudAdc;
    return gcloudAdc;
  }

  throw new Error(
    'No Firestore credentials found. Run one of:\n' +
      '  firebase login\n' +
      '  gcloud auth application-default login\n' +
      '  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json',
  );
}

/** Returns true when firebase-tools.json has a non-expired access token (informational). */
export function hasFirebaseCliAccessToken(): boolean {
  try {
    const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (!existsSync(configPath)) return false;
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
      tokens?: { access_token?: string; expires_at?: number };
    };
    const tokens = config.tokens;
    return Boolean(tokens?.access_token && tokens.expires_at && tokens.expires_at > Date.now());
  } catch {
    return false;
  }
}