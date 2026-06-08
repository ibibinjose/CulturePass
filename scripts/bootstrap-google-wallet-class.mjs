#!/usr/bin/env node
/**
 * Bootstrap the Google Wallet business-card Generic class using functions/.env credentials.
 * Does not require admin HTTP auth (calls Google Wallet API directly).
 *
 * Usage: node scripts/bootstrap-google-wallet-class.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, 'functions', '.env');

const child = spawnSync(
  'bash',
  ['-lc', `set -a && source "${ENV_PATH}" && set +a && node -e "
    const { bootstrapGoogleBusinessCardClass } = require('./lib/functions/src/services/walletPasses.js');
    bootstrapGoogleBusinessCardClass()
      .then((r) => { console.log(JSON.stringify(r, null, 2)); })
      .catch((e) => { console.error(e.message || e); process.exit(1); });
  "`],
  { cwd: path.join(ROOT, 'functions'), encoding: 'utf8' },
);

process.stdout.write(child.stdout ?? '');
process.stderr.write(child.stderr ?? '');
process.exit(child.status ?? 1);