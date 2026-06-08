#!/usr/bin/env node
/**
 * Print wallet readiness from functions/.env (local) or production API (with --remote).
 * Usage:
 *   node scripts/wallet-readiness.mjs
 *   node scripts/wallet-readiness.mjs --remote
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const remote = process.argv.includes('--remote');

if (remote) {
  const url = process.env.WALLET_READINESS_URL
    ?? 'https://australia-southeast1-culturepass-4f264.cloudfunctions.net/api/admin/wallet/business-card/readiness';
  console.log(`Fetching ${url} (requires admin auth token in WALLET_ADMIN_BEARER if set)...`);
  const headers = process.env.WALLET_ADMIN_BEARER
    ? { Authorization: `Bearer ${process.env.WALLET_ADMIN_BEARER}` }
    : {};
  const res = await fetch(url, { headers });
  const text = await res.text();
  console.log(res.status, text);
  process.exit(res.ok ? 0 : 1);
}

const envPath = path.join(ROOT, 'functions', '.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing functions/.env');
  process.exit(1);
}

const child = spawnSync(
  'bash',
  ['-lc', `set -a && source "${envPath}" && set +a && node -e "
    const { getWalletPassReadiness, isMockWalletConfiguration } = require('./lib/functions/src/services/walletPasses.js');
    const r = getWalletPassReadiness();
    console.log(JSON.stringify({ ...r, productionReady: r.apple.ready && r.googleBusinessCard.ready && !r.mockCredentials }, null, 2));
  "`],
  { cwd: path.join(ROOT, 'functions'), encoding: 'utf8' },
);

process.stdout.write(child.stdout ?? '');
process.stderr.write(child.stderr ?? '');
process.exit(child.status ?? 1);