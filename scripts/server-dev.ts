import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from functions/.env for local dev
dotenv.config({ path: path.resolve(__dirname, '../functions/.env') });

import { app } from '../functions/src/app';

// Align Admin SDK with production project when no emulator/credentials env is set.
// Routes that need Firestore still require FUNCTIONS_EMULATOR, GOOGLE_APPLICATION_CREDENTIALS,
// or K_SERVICE (see isFirestoreConfigured in functions/src/admin.ts).
if (!process.env.GCLOUD_PROJECT && !process.env.GOOGLE_CLOUD_PROJECT) {
  process.env.GCLOUD_PROJECT = process.env.FIREBASE_PROJECT_ID ?? 'culturepass-4f264';
}

const port = Number(process.env.PORT ?? 5050);

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`[server:dev] listening on http://127.0.0.1:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
