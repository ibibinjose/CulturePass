#!/usr/bin/env node
/**
 * Registers Android debug (and optional release) SHA fingerprints with Firebase,
 * then refreshes google-services.json so oauth_client includes client_type 1.
 *
 * Usage:
 *   npm run google:android-sha
 *   ANDROID_EXTRA_SHA_FINGERPRINTS="AA:BB:..." npm run google:android-sha
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'culturepass-4f264';
const ANDROID_APP_ID =
  process.env.FIREBASE_ANDROID_APP_ID || '1:476251116440:android:6a9ee92a0050c1ff5151ed';
const DEBUG_KEYSTORE = path.join(ROOT, 'android/app/debug.keystore');
const ANDROID_JSON_PATH = path.join(ROOT, 'android/app/google-services.json');
const ROOT_ANDROID_JSON_PATH = path.join(ROOT, 'google-services.json');

function runFirebase(args) {
  return execSync(`npx -y firebase-tools@latest ${args} --project ${PROJECT_ID}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function parseFingerprints(keytoolOutput) {
  const sha1 = keytoolOutput.match(/SHA1:\s*([0-9A-F:]+)/i)?.[1] ?? null;
  const sha256 = keytoolOutput.match(/SHA256:\s*([0-9A-F:]+)/i)?.[1] ?? null;
  return { sha1, sha256 };
}

function listRegisteredSha() {
  try {
    const out = runFirebase(`apps:android:sha:list ${ANDROID_APP_ID} -j`);
    const parsed = JSON.parse(out);
    return parsed?.result ?? [];
  } catch {
    return [];
  }
}

function normalizeHash(hash) {
  return hash.replace(/:/g, '').toUpperCase();
}

function registerSha(hash) {
  const normalized = normalizeHash(hash);
  runFirebase(`apps:android:sha:create ${ANDROID_APP_ID} ${normalized}`);
  console.log(`Registered SHA: ${hash}`);
}

function hasAndroidOAuthClient(jsonText) {
  const data = JSON.parse(jsonText);
  const oauth = data.client?.[0]?.oauth_client ?? [];
  return oauth.some((entry) => entry.client_type === 1);
}

function refreshGoogleServicesJson() {
  const androidJson = runFirebase(`apps:sdkconfig ANDROID ${ANDROID_APP_ID}`);
  fs.mkdirSync(path.dirname(ANDROID_JSON_PATH), { recursive: true });
  const formatted = JSON.stringify(JSON.parse(androidJson), null, 2) + '\n';
  fs.writeFileSync(ANDROID_JSON_PATH, formatted);
  fs.writeFileSync(ROOT_ANDROID_JSON_PATH, formatted);

  const downloadsJson = path.join(process.env.HOME || '', 'Downloads', 'google-services.json');
  if (fs.existsSync(path.dirname(downloadsJson))) {
    fs.writeFileSync(downloadsJson, formatted);
  }

  return formatted;
}

function main() {
  if (!fs.existsSync(DEBUG_KEYSTORE)) {
    console.error(`Missing debug keystore at ${DEBUG_KEYSTORE}`);
    process.exit(1);
  }

  const keytoolOutput = execSync(
    `keytool -list -v -keystore "${DEBUG_KEYSTORE}" -alias androiddebugkey -storepass android -keypass android`,
    { encoding: 'utf8' },
  );
  const { sha1, sha256 } = parseFingerprints(keytoolOutput);
  if (!sha1 || !sha256) {
    console.error('Could not parse SHA fingerprints from debug keystore.');
    process.exit(1);
  }

  const extra = (process.env.ANDROID_EXTRA_SHA_FINGERPRINTS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const toRegister = [sha1, sha256, ...extra];
  const existing = new Set(
    listRegisteredSha().map((entry) => normalizeHash(entry.shaHash ?? entry.certHash ?? '')),
  );

  let added = 0;
  for (const fingerprint of toRegister) {
    const normalized = normalizeHash(fingerprint);
    if (!normalized || existing.has(normalized)) {
      console.log(`Skipping already registered SHA: ${fingerprint}`);
      continue;
    }
    registerSha(fingerprint);
    existing.add(normalized);
    added += 1;
  }

  if (added === 0) {
    console.log('All SHA fingerprints already registered in Firebase.');
  }

  const jsonText = refreshGoogleServicesJson();
  if (hasAndroidOAuthClient(jsonText)) {
    console.log('google-services.json now includes Android OAuth client (client_type 1).');
  } else {
    console.warn(
      'google-services.json still missing client_type 1 — wait a minute and run npm run google:sync',
    );
  }

  console.log(`Updated ${ANDROID_JSON_PATH}`);
  console.log(`Updated ${ROOT_ANDROID_JSON_PATH}`);
}

main();