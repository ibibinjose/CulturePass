/**
 * Rebuild a CulturePass Apple Wallet .pkpass locally.
 *
 * Usage:
 *   cd functions && npx ts-node scripts/rebuild-pkpass.ts
 *   cd functions && npx ts-node scripts/rebuild-pkpass.ts CP-U58B35B
 *   cd functions && npx ts-node scripts/rebuild-pkpass.ts CP-U58B35B ../CulturePass-ID-CP-U58B35B.pkpass
 *
 * Rebuild every pass type: npm run rebuild:wallet-passes
 *
 * Requires Apple signing env vars in functions/.env (or mock certs for unsigned preview).
 */

import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { DEMO_CPID_VIKRAM, DEMO_USER_VIKRAM } from '../src/dev/demoFixtures';
import { generateAppleBusinessCardPass, type WalletPassUser } from '../src/services/walletPasses';

loadEnv({ path: resolve(__dirname, '../.env') });

function walletUserForCpid(cpid: string): WalletPassUser {
  const normalized = cpid.trim().toUpperCase();
  if (normalized === DEMO_CPID_VIKRAM || normalized === 'CP-U58B35B') {
    return {
      id: DEMO_USER_VIKRAM.id,
      username: DEMO_USER_VIKRAM.username,
      displayName: DEMO_USER_VIKRAM.displayName,
      email: DEMO_USER_VIKRAM.email,
      city: DEMO_USER_VIKRAM.city,
      country: DEMO_USER_VIKRAM.country,
      culturePassId: DEMO_CPID_VIKRAM,
      tier: DEMO_USER_VIKRAM.membership.tier,
      avatarUrl: DEMO_USER_VIKRAM.avatarUrl ?? undefined,
      createdAt: '2026-06-01T00:00:00.000Z',
    };
  }

  const slug = normalized.replace(/^CP-/, '').toLowerCase();
  return {
    id: `rebuild-${slug}`,
    username: slug.slice(0, 12) || 'member',
    displayName: 'CulturePass Member',
    city: 'Sydney',
    country: 'Australia',
    culturePassId: normalized.startsWith('CP-') ? normalized : `CP-${normalized}`,
    tier: 'free',
    createdAt: new Date().toISOString(),
  };
}

async function main() {
  const cpidArg = (process.argv[2] ?? DEMO_CPID_VIKRAM).trim().toUpperCase();
  const safeCpid = cpidArg.replace(/[^a-zA-Z0-9_-]/g, '') || 'member';
  const defaultOut = resolve(__dirname, `../../CulturePass-ID-${safeCpid}.pkpass`);
  const outPath = resolve(process.argv[3] ? resolve(process.cwd(), process.argv[3]) : defaultOut);

  const user = walletUserForCpid(cpidArg);
  console.log(`Rebuilding Apple Wallet pass for ${user.culturePassId} (${user.displayName})…`);

  const buffer = await generateAppleBusinessCardPass(user);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buffer);

  console.log(`Wrote ${buffer.length} bytes → ${outPath}`);
}

main().catch((err) => {
  console.error('pkpass rebuild failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});