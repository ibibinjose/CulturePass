#!/usr/bin/env node
/**
 * Ensures Firebase Web SDK env vars are present before `expo export --platform web`.
 * Checks process.env first, then merges values from repo-root `.env` (does not override
 * already-set environment variables).
 *
 * Run automatically from `npm run deploy-web`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const REQUIRED = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

function parseDotEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in out)) out[key] = val;
  }
  return out;
}

function resolveEnv(dotenv) {
  const merged = { ...dotenv };
  for (const k of REQUIRED) {
    const fromProcess = process.env[k]?.trim();
    if (fromProcess) merged[k] = fromProcess;
  }
  return merged;
}

const dotenv = parseDotEnv(path.join(ROOT, '.env'));
const env = resolveEnv(dotenv);

const missing = REQUIRED.filter((k) => !env[k]?.trim());
if (missing.length > 0) {
  console.error(
    '\n[deploy-web] Missing Firebase web variables:\n  ' +
      missing.join('\n  ') +
      '\n\nSet them in the shell (CI secrets) or in a repo-root `.env` (copy from .env.example), ' +
      'then run deploy again.\n' +
      'EXPO_PUBLIC_* are inlined at export time — Hosting will not pick them up from Firebase Console.\n',
  );
  process.exit(1);
}

const apiKey = env.EXPO_PUBLIC_FIREBASE_API_KEY.trim();
if (apiKey.length < 30 || apiKey === 'mock_api_key') {
  console.error(
    '\n[deploy-web] EXPO_PUBLIC_FIREBASE_API_KEY looks invalid or is still the local mock placeholder.\n' +
      'Use the real Web API key from Firebase Console → Project settings → Your apps → Web app.\n' +
      'If you only need a throwaway export (e.g. CI), run `npm run build-web:with-mock-firebase` instead of deploy-web.\n',
  );
  process.exit(1);
}

console.log('[deploy-web] Firebase web env OK for export.');
