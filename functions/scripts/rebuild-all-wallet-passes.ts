/**
 * Rebuild all CulturePass wallet pass artifacts (Apple .pkpass + Google save links).
 *
 * Usage:
 *   cd functions && npm run rebuild:wallet-passes
 *   cd functions && npm run rebuild:wallet-passes -- ~/Downloads/culturepass-wallet-passes
 */

import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  DEMO_CPID_AARAV,
  DEMO_CPID_VIKRAM,
  DEMO_GATE_EVENT,
  DEMO_TICKET_QR_VALID,
  DEMO_USER_AARAV,
  DEMO_USER_VIKRAM,
} from '../src/dev/demoFixtures';
import {
  createGoogleBusinessCardSaveUrl,
  createGoogleEventTicketSaveUrl,
  generateAppleBusinessCardPass,
  generateAppleEventTicketPass,
  getWalletPassReadiness,
  type WalletPassUser,
  type WalletTicketInput,
} from '../src/services/walletPasses';

loadEnv({ path: resolve(__dirname, '../.env') });

type IdFixture = { label: string; user: WalletPassUser };

const ID_FIXTURES: IdFixture[] = [
  {
    label: DEMO_CPID_VIKRAM,
    user: {
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
    },
  },
  {
    label: DEMO_CPID_AARAV,
    user: {
      id: DEMO_USER_AARAV.id,
      username: DEMO_USER_AARAV.username,
      displayName: DEMO_USER_AARAV.displayName,
      email: DEMO_USER_AARAV.email,
      city: DEMO_USER_AARAV.city,
      country: DEMO_USER_AARAV.country,
      culturePassId: DEMO_CPID_AARAV,
      tier: DEMO_USER_AARAV.membership.tier,
      avatarUrl: DEMO_USER_AARAV.avatarUrl ?? undefined,
      createdAt: '2026-05-15T00:00:00.000Z',
    },
  },
  {
    label: 'CP-STANDARD01',
    user: {
      id: 'rebuild-standard',
      username: 'standardmember',
      displayName: 'Standard Member',
      city: 'Melbourne',
      country: 'Australia',
      culturePassId: 'CP-STANDARD01',
      tier: 'free',
      createdAt: '2026-01-10T00:00:00.000Z',
    },
  },
];

const DEMO_TICKET: WalletTicketInput = {
  id: 'demo-ticket-valid',
  eventId: DEMO_GATE_EVENT.id,
  userId: DEMO_USER_VIKRAM.id,
  status: 'confirmed',
  paymentStatus: 'paid',
  tierName: 'VIP Lounge',
  qrCode: DEMO_TICKET_QR_VALID,
  cpTicketId: DEMO_TICKET_QR_VALID,
  eventTitle: DEMO_GATE_EVENT.title,
  eventDate: DEMO_GATE_EVENT.date,
  eventVenue: DEMO_GATE_EVENT.venue,
};

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '') || 'pass';
}

async function main() {
  const outDir = resolve(process.argv[2] ?? resolve(__dirname, '../../wallet-pass-artifacts'));
  mkdirSync(outDir, { recursive: true });

  const readiness = getWalletPassReadiness();
  const manifest: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    passRevision: '2026-06-12-wallet-v3',
    outputDir: outDir,
    artifacts: {} as Record<string, string>,
  };
  const artifacts = manifest.artifacts as Record<string, string>;

  console.log(`Output → ${outDir}\n`);

  if (!readiness.apple.ready) {
    console.warn('Apple Wallet not configured — skipping .pkpass files:', readiness.apple.missing.join(', '));
  } else {
    for (const fixture of ID_FIXTURES) {
      const filename = `CulturePass-ID-${safeName(fixture.label)}.pkpass`;
      const outPath = resolve(outDir, filename);
      console.log(`Apple ID · ${fixture.label} (${fixture.user.displayName})`);
      const buffer = await generateAppleBusinessCardPass(fixture.user);
      writeFileSync(outPath, buffer);
      artifacts[`apple/id/${fixture.label}`] = outPath;
      console.log(`  ✓ ${filename} (${buffer.length} bytes)`);
    }

    const ticketFilename = `CulturePass-Ticket-${safeName(DEMO_TICKET.cpTicketId)}.pkpass`;
    const ticketPath = resolve(outDir, ticketFilename);
    console.log(`Apple Ticket · ${DEMO_TICKET.cpTicketId}`);
    const ticketBuffer = await generateAppleEventTicketPass(DEMO_TICKET, {
      title: DEMO_GATE_EVENT.title,
      date: DEMO_GATE_EVENT.date,
      time: DEMO_GATE_EVENT.time,
      venue: DEMO_GATE_EVENT.venue,
    });
    writeFileSync(ticketPath, ticketBuffer);
    artifacts[`apple/ticket/${DEMO_TICKET.cpTicketId}`] = ticketPath;
    console.log(`  ✓ ${ticketFilename} (${ticketBuffer.length} bytes)`);
  }

  if (!readiness.googleBusinessCard.ready) {
    console.warn('\nGoogle Wallet business card not configured — skipping ID save links:', readiness.googleBusinessCard.missing.join(', '));
  } else {
    for (const fixture of ID_FIXTURES) {
      const url = await createGoogleBusinessCardSaveUrl(fixture.user);
      const filename = `google-id-${safeName(fixture.label)}.url`;
      const outPath = resolve(outDir, filename);
      writeFileSync(outPath, `${url}\n`);
      artifacts[`google/id/${fixture.label}`] = outPath;
      console.log(`Google ID · ${fixture.label} → ${filename}`);
    }
  }

  if (!readiness.google.ready) {
    console.warn('\nGoogle Wallet tickets not configured — skipping ticket save link:', readiness.google.missing.join(', '));
  } else {
    const ticketUrl = await createGoogleEventTicketSaveUrl(DEMO_TICKET, {
      title: DEMO_GATE_EVENT.title,
      date: DEMO_GATE_EVENT.date,
      time: DEMO_GATE_EVENT.time,
      venue: DEMO_GATE_EVENT.venue,
    });
    const ticketUrlPath = resolve(outDir, `google-ticket-${safeName(DEMO_TICKET.cpTicketId)}.url`);
    writeFileSync(ticketUrlPath, `${ticketUrl}\n`);
    artifacts[`google/ticket/${DEMO_TICKET.cpTicketId}`] = ticketUrlPath;
    console.log(`Google Ticket · ${DEMO_TICKET.cpTicketId} → google-ticket-${safeName(DEMO_TICKET.cpTicketId)}.url`);
  }

  const manifestPath = resolve(outDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest → ${manifestPath}`);
}

main().catch((err) => {
  console.error('Wallet pass rebuild failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});