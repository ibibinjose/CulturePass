#!/usr/bin/env node
/**
 * Push wallet-related env vars from functions/.env to Firebase Secret Manager.
 * Skips mock Google credentials. Run after placing real certs in functions/.env
 * or after scripts/setup-wallet-secrets.sh.
 *
 * Usage: node scripts/push-wallet-secrets-from-env.mjs [projectId]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, 'functions', '.env');
const projectId = process.argv[2] ?? process.env.FIREBASE_PROJECT_ID ?? 'culturepass-4f264';

const WALLET_KEYS = [
  'APPLE_WWDR_CERT_PEM',
  'APPLE_PASS_SIGNER_CERT_PEM',
  'APPLE_PASS_SIGNER_KEY_PEM',
  'APPLE_PASS_SIGNER_KEY_PASSPHRASE',
  'APPLE_PASS_TYPE_IDENTIFIER',
  'APPLE_TEAM_IDENTIFIER',
  'WALLET_LINK_SIGNING_SECRET',
  'GOOGLE_WALLET_ISSUER_ID',
  'GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_WALLET_PRIVATE_KEY',
  'GOOGLE_WALLET_GENERIC_CLASS_ID',
  'GOOGLE_WALLET_TICKET_CLASS_ID',
  'PUBLIC_APP_ORIGIN',
  'WALLET_LINKS_PUBLIC_ORIGIN',
  'APPLE_PASS_WEBSERVICE_URL',
];

function parseEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function isMock(env) {
  return (
    env.GOOGLE_WALLET_ISSUER_ID === '1234567890123456789'
    || String(env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL ?? '').includes('local-mock@')
  );
}

const env = parseEnv(ENV_PATH);
if (isMock(env)) {
  console.error(
    '[push-wallet-secrets] functions/.env still has MOCK wallet credentials.\n'
    + 'Place real Apple pass.p12 + Google service-account.json in temp-certs/ and run:\n'
    + '  bash scripts/setup-wallet-secrets.sh\n'
    + 'Or manually fill functions/.env with production values before pushing.',
  );
  process.exit(1);
}

let pushed = 0;
for (const key of WALLET_KEYS) {
  const val = env[key]?.trim();
  if (!val) continue;
  const r = spawnSync(
    'npx',
    ['firebase-tools', 'functions:secrets:set', key, '--project', projectId, '--force'],
    { cwd: ROOT, input: val, encoding: 'utf8' },
  );
  if (r.status !== 0) {
    console.error(r.stderr || `Failed to set secret ${key}`);
    process.exit(r.status ?? 1);
  }
  pushed += 1;
  console.log(`✓ ${key}`);
}

console.log(`\n[push-wallet-secrets] Pushed ${pushed} secrets to ${projectId}. Run: npm run deploy-functions`);