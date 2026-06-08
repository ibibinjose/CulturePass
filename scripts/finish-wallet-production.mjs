#!/usr/bin/env node
/**
 * Non-interactive wallet production finish:
 * - Converts temp-certs/pass.p12 + wwdr.cer → functions/.env PEM fields
 * - Sets GOOGLE_WALLET_ISSUER_ID from env/argv
 * - Optionally pushes Firebase secrets + reminds to deploy
 *
 * Usage:
 *   GOOGLE_WALLET_ISSUER_ID=3388... P12_PASS=secret node scripts/finish-wallet-production.mjs
 *   node scripts/finish-wallet-production.mjs --issuer 3388... --p12-pass secret
 *   node scripts/finish-wallet-production.mjs --issuer 3388... --google-only
 *   node scripts/finish-wallet-production.mjs --issuer 3388... --from-keychain
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMP = path.join(ROOT, 'temp-certs');
const ENV_PATH = path.join(ROOT, 'functions', '.env');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID?.trim() || arg('--issuer')?.trim();
const p12Pass = process.env.P12_PASS ?? arg('--p12-pass') ?? '';
const googleOnly = process.argv.includes('--google-only');
const fromKeychain = process.argv.includes('--from-keychain');
const passTypeId = process.env.APPLE_PASS_TYPE_IDENTIFIER ?? 'pass.au.culturepass.app';

if (!issuerId || issuerId === '1234567890123456789') {
  console.error('Set GOOGLE_WALLET_ISSUER_ID (from https://pay.google.com/business/console)');
  process.exit(1);
}

const passP12 = path.join(TEMP, 'pass.p12');
const wwdrCer = path.join(TEMP, 'wwdr.cer');
if (!googleOnly && !fromKeychain) {
  if (!fs.existsSync(passP12)) {
    console.error(`Missing ${passP12}. Export Apple Pass Type ID cert from Keychain, or pass --from-keychain / --google-only.`);
    process.exit(1);
  }
  if (!fs.existsSync(wwdrCer)) {
    console.error(`Missing ${wwdrCer}. Download Apple WWDR G4 from https://www.apple.com/certificateauthority/`);
    process.exit(1);
  }
}
if (!googleOnly && fromKeychain && !fs.existsSync(wwdrCer)) {
  console.error(`Missing ${wwdrCer}. Download Apple WWDR G4 from https://www.apple.com/certificateauthority/`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', cwd: ROOT, ...opts });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || `${cmd} failed`);
    process.exit(r.status ?? 1);
  }
  return (r.stdout ?? '').trim();
}

function findPassTypeIdentityHash() {
  let identities = run('security', ['find-identity', '-v', '-p', 'codesigning']);
  if (!identities.includes(passTypeId)) {
    identities = run('security', ['find-identity', '-v']);
  }
  const line = identities
    .split('\n')
    .find((entry) => entry.includes(`Pass Type ID: ${passTypeId}`) || entry.includes(passTypeId));
  if (!line) {
    console.error(`No Keychain identity found for ${passTypeId}. Install the Pass Type ID certificate first.`);
    process.exit(1);
  }
  const match = line.match(/([A-F0-9]{40})/);
  if (!match) {
    console.error('Could not parse Keychain identity hash.');
    process.exit(1);
  }
  return match[1];
}

function materializeAppleCredentialsFromKeychain() {
  const signerCert = path.join(TEMP, 'signerCert.pem');
  const signerKey = path.join(TEMP, 'signerKey.pem');
  const wwdrPem = path.join(TEMP, 'wwdr.pem');
  const exportedP12 = path.join(TEMP, 'pass-from-keychain.p12');
  const keychain = path.join(os.homedir(), 'Library/Keychains/login.keychain-db');
  const identityHash = findPassTypeIdentityHash();

  console.log(`Using Keychain identity ${identityHash} (${passTypeId})`);
  const certPem = run('security', [
    'find-certificate',
    '-c',
    `Pass Type ID: ${passTypeId}`,
    '-p',
    keychain,
  ]);
  fs.writeFileSync(signerCert, `${certPem}\n`);

  const exportResult = spawnSync(
    'security',
    [
      'export',
      '-k',
      keychain,
      '-t',
      'identities',
      '-f',
      'pkcs12',
      '-o',
      exportedP12,
      '-P',
      '',
      identityHash,
    ],
    { encoding: 'utf8', cwd: ROOT, timeout: 20000 },
  );
  if (exportResult.status !== 0 || !fs.existsSync(exportedP12)) {
    console.error(
      exportResult.stderr
      || 'Keychain export failed. Approve the macOS Keychain access prompt, then rerun with --from-keychain.\n'
      + 'Or re-export temp-certs/pass.p12 from Keychain with an empty password and rerun normally.',
    );
    process.exit(exportResult.status ?? 1);
  }

  run('openssl', ['pkcs12', '-in', exportedP12, '-nocerts', '-nodes', '-out', signerKey, '-passin', 'pass:']);
  run('openssl', ['x509', '-inform', 'der', '-in', wwdrCer, '-out', wwdrPem]);

  return { signerCert, signerKey, wwdrPem, cleanup: [signerCert, signerKey, wwdrPem, exportedP12] };
}

const b64 = (p) => Buffer.from(fs.readFileSync(p, 'utf8')).toString('base64');

function upsertEnv(updates) {
  const lines = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8').split('\n') : [];
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}=`);
    const line = `${key}=${value}`;
    const idx = lines.findIndex((l) => re.test(l));
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(ENV_PATH, `${lines.join('\n').replace(/\n+$/, '')}\n`);
}

const sharedEnv = {
  GOOGLE_WALLET_ISSUER_ID: issuerId,
  PUBLIC_APP_ORIGIN: 'https://culturepass.app',
  WALLET_LINKS_PUBLIC_ORIGIN: 'https://culturepass.app',
  APPLE_PASS_WEBSERVICE_URL: 'https://culturepass.app/api/wallet/apple/v1',
};

if (googleOnly) {
  upsertEnv(sharedEnv);
  console.log('✓ Updated functions/.env with production Google issuer (Apple certs unchanged)');
} else {
  const appleMaterial = fromKeychain
    ? materializeAppleCredentialsFromKeychain()
    : (() => {
      const signerCert = path.join(TEMP, 'signerCert.pem');
      const signerKey = path.join(TEMP, 'signerKey.pem');
      const wwdrPem = path.join(TEMP, 'wwdr.pem');
      run('openssl', ['pkcs12', '-in', passP12, '-clcerts', '-nokeys', '-out', signerCert, '-passin', `pass:${p12Pass}`]);
      run('openssl', ['pkcs12', '-in', passP12, '-nocerts', '-nodes', '-out', signerKey, '-passin', `pass:${p12Pass}`]);
      run('openssl', ['x509', '-inform', 'der', '-in', wwdrCer, '-out', wwdrPem]);
      return { signerCert, signerKey, wwdrPem, cleanup: [signerCert, signerKey, wwdrPem] };
    })();

  upsertEnv({
    APPLE_WWDR_CERT_PEM: b64(appleMaterial.wwdrPem),
    APPLE_PASS_SIGNER_CERT_PEM: b64(appleMaterial.signerCert),
    APPLE_PASS_SIGNER_KEY_PEM: b64(appleMaterial.signerKey),
    APPLE_PASS_SIGNER_KEY_PASSPHRASE: fromKeychain ? '' : p12Pass,
    APPLE_PASS_TYPE_IDENTIFIER: passTypeId,
    APPLE_TEAM_IDENTIFIER: process.env.APPLE_TEAM_IDENTIFIER ?? '26WGXSNG58',
    ...sharedEnv,
  });

  for (const f of appleMaterial.cleanup) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }

  console.log(`✓ Updated functions/.env with production Apple + Google issuer${fromKeychain ? ' (from Keychain)' : ''}`);
}

console.log('Authorize wallet-passes@culturepass-4f264.iam.gserviceaccount.com in Google Pay & Wallet Console.');
console.log('Next: npm run wallet:secrets:push && npm run deploy-functions');
console.log('Then bootstrap: npm run wallet:bootstrap-google');