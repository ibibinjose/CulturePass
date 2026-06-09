#!/usr/bin/env node
/**
 * Provisions Google Maps API key + FCM Web Push VAPID key for local .env.
 *
 * Maps: creates/enables Maps SDK APIs via Google Cloud API Keys API (firebase CLI token).
 * VAPID: opens Firebase Console to generate the Web Push key pair (one-time UI step),
 *         then reads the public key into .env.
 *
 * Usage:
 *   npm run maps:sync          # Maps only (fully automated)
 *   npm run fcm:vapid:setup    # Interactive VAPID setup via browser
 *   npm run google:extras:sync # Both
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'culturepass-4f264';
const PROJECT_NUMBER = process.env.FIREBASE_PROJECT_NUMBER || '476251116440';
const MAPS_KEY_DISPLAY_NAME = 'CulturePass Maps (Expo)';

const MAPS_SERVICES = [
  'maps-ios-backend.googleapis.com',
  'maps-android-backend.googleapis.com',
  'maps-backend.googleapis.com',
  'geocoding-backend.googleapis.com',
  'places-backend.googleapis.com',
];

function getFirebaseAccessToken() {
  const configPath = path.join(process.env.HOME, '.config/configstore/firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  if (!token) throw new Error('Firebase CLI not logged in. Run: npx firebase login');
  return token;
}

function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function pollOperation(opName, token) {
  for (let i = 0; i < 15; i++) {
    const poll = await request('GET', `https://apikeys.googleapis.com/v2/${opName}`, null, token);
    const parsed = JSON.parse(poll.body);
    if (parsed.done) return parsed.response;
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error(`Timed out waiting for operation: ${opName}`);
}

function upsertEnv(key, value) {
  if (!fs.existsSync(ENV_PATH)) throw new Error(`Missing ${ENV_PATH}`);
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
  const idx = lines.findIndex((line) => line.startsWith(`${key}=`));
  const next = `${key}=${value}`;
  if (idx >= 0) lines[idx] = next;
  else lines.push(next);
  fs.writeFileSync(ENV_PATH, lines.join('\n'));
  console.log(`  ✓ ${key}`);
}

async function findExistingMapsKey(token) {
  const list = await request(
    'GET',
    `https://apikeys.googleapis.com/v2/projects/${PROJECT_NUMBER}/locations/global/keys`,
    null,
    token,
  );
  const parsed = JSON.parse(list.body);
  const existing = (parsed.keys || []).find((k) => k.displayName === MAPS_KEY_DISPLAY_NAME);
  if (!existing?.name) return null;
  const keyString = await request('GET', `https://apikeys.googleapis.com/v2/${existing.name}/keyString`, null, token);
  const keyParsed = JSON.parse(keyString.body);
  return keyParsed.keyString || null;
}

export async function syncMapsKey() {
  const token = getFirebaseAccessToken();
  console.log('Syncing Google Maps API key...');

  let mapsKey = await findExistingMapsKey(token);
  if (!mapsKey) {
    for (const service of MAPS_SERVICES) {
      await request(
        'POST',
        `https://serviceusage.googleapis.com/v1/projects/${PROJECT_NUMBER}/services/${service}:enable`,
        '{}',
        token,
      );
    }

    const createBody = JSON.stringify({
      displayName: MAPS_KEY_DISPLAY_NAME,
      restrictions: { apiTargets: MAPS_SERVICES.map((service) => ({ service })) },
    });
    const create = await request(
      'POST',
      `https://apikeys.googleapis.com/v2/projects/${PROJECT_NUMBER}/locations/global/keys`,
      createBody,
      token,
    );
    if (create.status !== 200) {
      throw new Error(`Failed to create Maps API key: ${create.body}`);
    }
    const op = JSON.parse(create.body);
    const keyResource = op.response?.name ? op.response : await pollOperation(op.name, token);
    const keyStringRes = await request(
      'GET',
      `https://apikeys.googleapis.com/v2/${keyResource.name}/keyString`,
      null,
      token,
    );
    mapsKey = JSON.parse(keyStringRes.body).keyString;
  }

  upsertEnv('EXPO_PUBLIC_GOOGLE_MAPS_KEY', mapsKey);
  console.log('Maps API key synced.');
  return mapsKey;
}

export async function setupFcmVapidInteractive() {
  const { chromium } = await import('@playwright/test');
  const consoleUrl = `https://console.firebase.google.com/project/${PROJECT_ID}/settings/cloudmessaging`;

  console.log('Opening Firebase Console for Web Push VAPID key generation...');
  console.log(`URL: ${consoleUrl}`);
  console.log('Sign in if prompted, then click "Generate key pair" under Web Push certificates.');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(consoleUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

  console.log('Waiting for VAPID public key (BH... or B... base64url) on the page...');

  let vapidKey = null;
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const text = await page.locator('body').innerText();
    const match = text.match(/\b(BH[\w-]{60,}|B[\w-]{80,})\b/);
    if (match) {
      vapidKey = match[1];
      break;
    }
    await page.waitForTimeout(2000);
  }

  await browser.close();

  if (!vapidKey) {
    throw new Error(
      'Could not detect VAPID public key. Generate it manually in Firebase Console → Project settings → Cloud Messaging → Web Push certificates, then add EXPO_PUBLIC_FCM_VAPID_KEY to .env',
    );
  }

  upsertEnv('EXPO_PUBLIC_FCM_VAPID_KEY', vapidKey);
  console.log('FCM VAPID public key saved.');
  return vapidKey;
}

async function main() {
  const mode = process.argv[2] || 'all';
  if (mode === 'maps' || mode === 'all') {
    await syncMapsKey();
  }
  if (mode === 'vapid' || mode === 'all') {
    await setupFcmVapidInteractive();
  }
}

import { pathToFileURL } from 'node:url';

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}