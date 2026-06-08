#!/usr/bin/env node
/**
 * Push non-empty EXPO_PUBLIC_* vars from .env to EAS (preview or production).
 * Skips blank values so optional keys (Google Maps, VAPID) do not block the push.
 *
 * Usage:
 *   node scripts/eas-env-push.mjs production
 *   node scripts/eas-env-push.mjs preview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const envName = (process.argv[2] ?? 'production').trim();

if (!['production', 'preview', 'development'].includes(envName)) {
  console.error('Usage: node scripts/eas-env-push.mjs <production|preview|development>');
  process.exit(1);
}

const src = path.join(ROOT, '.env');
if (!fs.existsSync(src)) {
  console.error('[eas-env-push] Missing .env — copy from .env.example and fill values.');
  process.exit(1);
}

const filtered = path.join(ROOT, `.env.eas-${envName}`);
const lines = fs.readFileSync(src, 'utf8').split('\n');
const out = [];

for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  let val = t.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!key.startsWith('EXPO_PUBLIC_')) continue;
  if (!val) continue;
  out.push(`${key}=${val}`);
}

if (out.length === 0) {
  console.error('[eas-env-push] No non-empty EXPO_PUBLIC_* variables found in .env');
  process.exit(1);
}

fs.writeFileSync(filtered, `${out.join('\n')}\n`);
console.log(`[eas-env-push] Pushing ${out.length} variables → EAS ${envName}`);

const result = spawnSync(
  'npx',
  ['eas-cli', 'env:push', '--environment', envName, '--path', filtered],
  { cwd: ROOT, stdio: 'inherit', env: process.env },
);

fs.unlinkSync(filtered);

process.exit(result.status ?? 1);