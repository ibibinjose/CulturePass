#!/usr/bin/env node
/**
 * Attempts to read or generate the FCM Web Push VAPID public key from Firebase Console.
 * Uses a copied Chrome profile when available (avoids SingletonLock while Chrome is open).
 *
 * Fallback: pass --key=<public-vapid-key> after generating manually in Firebase Console.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'culturepass-4f264';
const CONSOLE_URL = `https://console.firebase.google.com/project/${PROJECT_ID}/settings/cloudmessaging`;

function upsertEnv(key, value) {
  if (!fs.existsSync(ENV_PATH)) throw new Error(`Missing ${ENV_PATH}`);
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
  const idx = lines.findIndex((line) => line.startsWith(`${key}=`));
  const next = `${key}=${value}`;
  if (idx >= 0) lines[idx] = next;
  else lines.push(next);
  fs.writeFileSync(ENV_PATH, lines.join('\n'));
}

function extractVapid(text) {
  const match = text.match(/\b(BH[\w-]{60,})\b/);
  return match?.[1] ?? null;
}

function copyChromeProfile() {
  const source = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default');
  if (!fs.existsSync(source)) return null;
  const destRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-chrome-'));
  const dest = path.join(destRoot, 'Default');
  fs.mkdirSync(dest, { recursive: true });
  execSync(
    `rsync -a --exclude "Singleton*" --exclude "Cache" --exclude "Code Cache" "${source}/" "${dest}/"`,
    { stdio: 'ignore' },
  );
  return destRoot;
}

async function scrapeFromConsole(profileRoot) {
  const context = await chromium.launchPersistentContext(profileRoot, {
    channel: 'chrome',
    headless: true,
    args: ['--profile-directory=Default'],
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto(CONSOLE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(6000);

    let text = await page.locator('body').innerText();
    let vapid = extractVapid(text);

    if (!vapid) {
      const generate = page.getByRole('button', { name: /generate key pair/i });
      if (await generate.count()) {
        await generate.first().click({ timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(4000);
        text = await page.locator('body').innerText();
        vapid = extractVapid(text);
      }
    }

    return vapid;
  } finally {
    await context.close();
  }
}

function openConsole() {
  if (process.platform === 'darwin') {
    execSync(`open "${CONSOLE_URL}"`, { stdio: 'ignore' });
    return;
  }
  console.log(`Open: ${CONSOLE_URL}`);
}

async function promptForKey() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const key = await new Promise((resolve) => {
    rl.question(
      'Paste the Web Push public key (starts with BH...) from Firebase Console: ',
      (answer) => {
        rl.close();
        resolve(answer.trim());
      },
    );
  });
  if (!key) throw new Error('No key pasted.');
  upsertEnv('EXPO_PUBLIC_FCM_VAPID_KEY', key);
  console.log('Saved EXPO_PUBLIC_FCM_VAPID_KEY');
}

async function main() {
  const keyArg = process.argv.find((arg) => arg.startsWith('--key='));
  if (keyArg) {
    const key = keyArg.slice('--key='.length).trim();
    if (!key) throw new Error('Empty --key value');
    upsertEnv('EXPO_PUBLIC_FCM_VAPID_KEY', key);
    console.log('Saved EXPO_PUBLIC_FCM_VAPID_KEY from --key');
    return;
  }

  if (process.argv.includes('--prompt')) {
    openConsole();
    await promptForKey();
    return;
  }

  const profileRoot = copyChromeProfile();
  if (profileRoot) {
    console.log('Checking Firebase Console for Web Push VAPID key...');
    const vapid = await scrapeFromConsole(profileRoot);
    if (vapid) {
      upsertEnv('EXPO_PUBLIC_FCM_VAPID_KEY', vapid);
      console.log('Saved EXPO_PUBLIC_FCM_VAPID_KEY');
      return;
    }
  }

  console.log('Could not auto-detect VAPID key.');
  openConsole();
  console.log('In Firebase Console: Project settings → Cloud Messaging → Web Push certificates → Generate key pair');
  if (process.stdin.isTTY) {
    await promptForKey();
    return;
  }

  throw new Error(
    'Run interactively: npm run fcm:vapid:setup -- --prompt\nOr paste directly: npm run fcm:vapid:setup -- --key=YOUR_PUBLIC_KEY',
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});