#!/usr/bin/env node
/**
 * Downloads Firebase iOS/Android SDK configs and syncs Google OAuth env vars into .env.
 *
 * Usage:
 *   node scripts/sync-google-firebase-config.mjs
 *   npm run google:sync
 *
 * Requires: firebase login, project access to culturepass-4f264 (or set FIREBASE_PROJECT_ID).
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'culturepass-4f264';
const IOS_BUNDLE = 'au.culturepass.app';
const ANDROID_PACKAGE = 'au.culturepass.app';

const IOS_APP_ID =
  process.env.FIREBASE_IOS_APP_ID || '1:476251116440:ios:b52cdb156978e4655151ed';
const ANDROID_APP_ID =
  process.env.FIREBASE_ANDROID_APP_ID || '1:476251116440:android:6a9ee92a0050c1ff5151ed';

const IOS_PLIST_PATH = path.join(ROOT, 'ios/CulturePass/GoogleService-Info.plist');
const ANDROID_JSON_PATH = path.join(ROOT, 'android/app/google-services.json');
const ENV_PATH = path.join(ROOT, '.env');

function runFirebase(args) {
  return execSync(`npx -y firebase-tools@latest ${args} --project ${PROJECT_ID}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function parsePlistValue(xml, key) {
  const re = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`);
  const match = xml.match(re);
  return match?.[1] ?? null;
}

function extractAndroidWebClientId(jsonText) {
  const data = JSON.parse(jsonText);
  const client = data.client?.[0];
  const web = client?.oauth_client?.find((o) => o.client_type === 3);
  return web?.client_id ?? null;
}

function upsertEnv(lines, key, value) {
  const idx = lines.findIndex((line) => line.startsWith(`${key}=`));
  const next = `${key}=${value}`;
  if (idx >= 0) lines[idx] = next;
  else lines.push(next);
}

function main() {
  console.log(`Syncing Google Firebase config for ${PROJECT_ID}...`);

  const iosXml = runFirebase(`apps:sdkconfig IOS ${IOS_APP_ID}`);
  const androidJson = runFirebase(`apps:sdkconfig ANDROID ${ANDROID_APP_ID}`);

  fs.mkdirSync(path.dirname(IOS_PLIST_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(ANDROID_JSON_PATH), { recursive: true });
  fs.writeFileSync(IOS_PLIST_PATH, iosXml.trim() + '\n');
  fs.writeFileSync(ANDROID_JSON_PATH, JSON.stringify(JSON.parse(androidJson), null, 2) + '\n');

  const downloadsJson = path.join(os.homedir(), 'Downloads', 'google-services.json');
  if (fs.existsSync(downloadsJson)) {
    const downloaded = fs.readFileSync(downloadsJson, 'utf8');
    if (downloaded.trim()) {
      fs.writeFileSync(ANDROID_JSON_PATH, JSON.stringify(JSON.parse(downloaded), null, 2) + '\n');
      console.log(`Also synced from ${downloadsJson}`);
    }
  }

  const rootPlistPath = path.join(ROOT, 'GoogleService-Info.plist');
  const rootAndroidJsonPath = path.join(ROOT, 'google-services.json');
  const downloadsPlist = path.join(os.homedir(), 'Downloads', 'GoogleService-Info.plist');
  if (fs.existsSync(downloadsPlist)) {
    const downloadedPlist = fs.readFileSync(downloadsPlist, 'utf8');
    if (downloadedPlist.trim()) {
      fs.writeFileSync(IOS_PLIST_PATH, downloadedPlist.trim() + '\n');
      fs.writeFileSync(rootPlistPath, downloadedPlist.trim() + '\n');
      console.log(`Also synced iOS plist from ${downloadsPlist}`);
    }
  } else {
    fs.copyFileSync(IOS_PLIST_PATH, rootPlistPath);
  }
  fs.copyFileSync(ANDROID_JSON_PATH, rootAndroidJsonPath);

  const finalIosPlist = fs.readFileSync(IOS_PLIST_PATH, 'utf8');
  const finalAndroidJson = fs.readFileSync(ANDROID_JSON_PATH, 'utf8');
  const iosClientId = parsePlistValue(finalIosPlist, 'CLIENT_ID');
  const reversed = parsePlistValue(finalIosPlist, 'REVERSED_CLIENT_ID');
  const reversedSuffix = reversed?.replace('com.googleusercontent.apps.', '') ?? null;
  const webClientId = extractAndroidWebClientId(finalAndroidJson);

  if (!iosClientId || !reversedSuffix || !webClientId) {
    console.error('Could not parse OAuth client IDs from Firebase SDK config.');
    process.exit(1);
  }

  if (fs.existsSync(ENV_PATH)) {
    const envLines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
    upsertEnv(envLines, 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', webClientId);
    upsertEnv(envLines, 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', iosClientId);
    upsertEnv(envLines, 'EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID', reversedSuffix);
    fs.writeFileSync(ENV_PATH, envLines.join('\n'));
    console.log(`Updated ${ENV_PATH}`);
  } else {
    console.log('No .env file found. Add these manually:');
  }

  console.log('\nGoogle Sign-In env vars:');
  console.log(`  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=${webClientId}`);
  console.log(`  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=${iosClientId}`);
  console.log(`  EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID=${reversedSuffix}`);
  console.log(`\nWrote ${IOS_PLIST_PATH}`);
  console.log(`Wrote ${ANDROID_JSON_PATH}`);
  console.log(`Wrote ${rootPlistPath}`);
  console.log(`Wrote ${rootAndroidJsonPath}`);
  console.log(`\nBundle: ${IOS_BUNDLE} | Package: ${ANDROID_PACKAGE}`);
  console.log('Restart the Expo dev server after .env changes.');
  console.log('Optional: npm run maps:sync && npm run fcm:vapid:setup');

  try {
    const androidServices = JSON.parse(finalAndroidJson);
    const hasAndroidClient = (androidServices.client?.[0]?.oauth_client ?? []).some(
      (entry) => entry.client_type === 1,
    );
    if (!hasAndroidClient) {
      console.log('\nAndroid Google Sign-In needs SHA fingerprints — run: npm run google:android-sha');
    }
  } catch {
    // ignore parse errors
  }

  try {
    execSync('node scripts/link-google-services-ios.mjs', {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    console.warn('Could not link GoogleService-Info.plist in Xcode — run: node scripts/link-google-services-ios.mjs');
  }
}

main();