#!/usr/bin/env node
/**
 * Provision CulturePass Google Wallet service account + key (non-interactive).
 * Uses Firebase user ADC refresh token from ~/.config/firebase/*.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROJECT = 'culturepass-4f264';
const SA_ID = 'wallet-passes';
const SA_EMAIL = `${SA_ID}@${PROJECT}.iam.gserviceaccount.com`;

function findFirebaseAdc() {
  const dir = path.join(process.env.HOME ?? '', '.config', 'firebase');
  if (!fs.existsSync(dir)) throw new Error('No ~/.config/firebase directory');
  const file = fs.readdirSync(dir).find((f) => f.endsWith('_application_default_credentials.json'));
  if (!file) throw new Error('No Firebase ADC file found');
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
}

async function getAccessToken(adc) {
  const body = new URLSearchParams({
    client_id: adc.client_id,
    client_secret: adc.client_secret,
    refresh_token: adc.refresh_token,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Token error: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function gcp(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok && res.status !== 409) {
    throw new Error(`${res.status} ${url}: ${text}`);
  }
  return { status: res.status, json };
}

function b64Pem(pem) {
  return Buffer.from(pem, 'utf8').toString('base64');
}

function upsertEnv(envPath, updates) {
  let lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split('\n') : [];
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}=`);
    const line = `${key}=${value}`;
    const idx = lines.findIndex((l) => re.test(l));
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(envPath, `${lines.filter((l, i, a) => i < a.length - 1 || l !== '').join('\n')}\n`);
}

const adc = findFirebaseAdc();
const token = await getAccessToken(adc);

// Ensure service account exists
const create = await gcp(
  token,
  `https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts`,
  {
    method: 'POST',
    body: JSON.stringify({
      accountId: SA_ID,
      serviceAccount: { displayName: 'CulturePass Google Wallet' },
    }),
  },
);
if (create.status === 200) {
  console.log(`✓ Created service account ${SA_EMAIL}`);
} else {
  console.log(`✓ Service account ${SA_EMAIL} already exists`);
}

// Create key
const keyRes = await gcp(
  token,
  `https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts/${SA_EMAIL}/keys`,
  {
    method: 'POST',
    body: JSON.stringify({
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
      keyAlgorithm: 'KEY_ALG_RSA_2048',
    }),
  },
);
const keyJson = JSON.parse(
  Buffer.from(keyRes.json.privateKeyData, 'base64').toString('utf8'),
);

const tempCerts = path.join(ROOT, 'temp-certs');
fs.mkdirSync(tempCerts, { recursive: true });
const saPath = path.join(tempCerts, 'service-account.json');
fs.writeFileSync(saPath, `${JSON.stringify(keyJson, null, 2)}\n`, { mode: 0o600 });
console.log(`✓ Wrote ${saPath}`);

const envPath = path.join(ROOT, 'functions', '.env');
const privateKeyB64 = b64Pem(keyJson.private_key);
upsertEnv(envPath, {
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: keyJson.client_email,
  GOOGLE_WALLET_PRIVATE_KEY: privateKeyB64,
});
console.log(`✓ Updated functions/.env Google service account fields`);
console.log('\nNext: set GOOGLE_WALLET_ISSUER_ID in functions/.env from https://pay.google.com/business/console');
console.log(`Then authorize ${SA_EMAIL} as an issuer user in that console.`);