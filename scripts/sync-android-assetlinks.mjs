#!/usr/bin/env node
/**
 * Writes public/.well-known/assetlinks.json from ANDROID_SHA256_FINGERPRINTS.
 *
 * Usage:
 *   ANDROID_SHA256_FINGERPRINTS="AA:BB:...,CC:DD:..." node scripts/sync-android-assetlinks.mjs
 *
 * Get fingerprints from Play Console → App integrity, or:
 *   keytool -list -v -keystore your-release.keystore -alias your-alias
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'public/.well-known/assetlinks.json');

const raw = process.env.ANDROID_SHA256_FINGERPRINTS ?? '';
const fingerprints = raw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (fingerprints.length === 0) {
  console.error(
    '⚠️  ANDROID_SHA256_FINGERPRINTS is empty — assetlinks.json will not verify App Links.',
  );
  console.error('   Set comma-separated SHA-256 cert fingerprints and re-run.');
  process.exit(1);
}

const payload = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'au.culturepass.app',
      sha256_cert_fingerprints: fingerprints,
    },
  },
];

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`✅ Wrote ${target} (${fingerprints.length} fingerprint(s))`);