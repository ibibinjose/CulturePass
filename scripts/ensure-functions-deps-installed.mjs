#!/usr/bin/env node
/**
 * Root-level `tsx` tests import `functions/src/*`, which expects packages like
 * `firebase-admin` under `functions/node_modules`. A root-only `npm ci` does
 * not install the Functions subtree — run `npm ci` in `functions/` once when missing.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const marker = path.join(root, 'functions', 'node_modules', 'firebase-admin', 'package.json');

if (existsSync(marker)) {
  process.exit(0);
}

console.warn(
  '[CulturePass] functions/node_modules missing or incomplete — running npm ci in functions/ …',
);
const r = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], {
  cwd: path.join(root, 'functions'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(r.status ?? 1);
