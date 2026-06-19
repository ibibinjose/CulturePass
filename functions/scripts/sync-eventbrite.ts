#!/usr/bin/env ts-node
/**
 * Manual Eventbrite Australia → CulturePass sync.
 *
 * Run from project root:
 *   npm run sync:eventbrite
 *
 * Requires EVENTBRITE_PRIVATE_TOKEN in functions/.env or environment.
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
  console.log(`[sync:eventbrite] Using credentials: ${credPath}`);

  if (!process.env.EVENTBRITE_PRIVATE_TOKEN?.trim()) {
    console.warn(
      '[sync:eventbrite] EVENTBRITE_PRIVATE_TOKEN is not set — sync will no-op unless integrations/eventbrite.privateToken exists in Firestore.',
    );
  }

  const { syncEventbriteEvents } = await import('../src/services/eventbriteSync');
  const result = await syncEventbriteEvents();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0 && result.upserted === 0) {
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
        '  export EVENTBRITE_PRIVATE_TOKEN=your_token\n' +
        '  npm run sync:eventbrite\n',
    );
  }
  process.exit(1);
});