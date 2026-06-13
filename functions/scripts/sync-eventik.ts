#!/usr/bin/env ts-node
/**
 * Manual Eventik → CulturePass sync.
 *
 * Run from project root:
 *   npm run sync:eventik
 *
 * Credentials (first match wins):
 *   - GOOGLE_APPLICATION_CREDENTIALS
 *   - ~/.config/firebase/*_application_default_credentials.json  (`firebase login`)
 *   - ~/.config/gcloud/application_default_credentials.json
 */

process.env.GOOGLE_CLOUD_PROJECT =
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  'culturepass-4f264';

import { resolveGoogleApplicationCredentials } from './resolveFirebaseCredentials';

async function main() {
  const credPath = resolveGoogleApplicationCredentials();
  console.log(`[sync:eventik] Using credentials: ${credPath}`);

  const { syncEventikEvents } = await import('../src/services/eventikSync');
  const result = await syncEventikEvents();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(err);
  const msg = err instanceof Error ? err.message : String(err);
  if (/credentials|Could not load/i.test(msg)) {
    console.error(
      '\nTry:\n' +
        '  firebase login\n' +
        '  npm run sync:eventik\n',
    );
  }
  process.exit(1);
});