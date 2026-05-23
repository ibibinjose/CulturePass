/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { readFileSync } = require('fs');
const { parse } = require('csv-parse/sync');
const { program } = require('commander');

const admin = require('firebase-admin');
const crypto = require('crypto');
const { URL } = require('url');

const VALID_STATES = new Set(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']);

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  out.push(current.trim());
  return out;
}

function mapState(value) {
  const code = String(value || '').trim().toUpperCase();
  return VALID_STATES.has(code) ? code : null;
}

function councilIdFromAbs(abs) {
  return `co-au-${abs}`;
}

function asWebsite(raw) {
  const cleaned = String(raw || '').replace(/\s+/g, '');
  if (!cleaned) return undefined;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
  return `https://${cleaned}`;
}

function loadCouncilsFromCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 3) return [];

  const header = parseCsvLine(lines[1] || '');
  const indexByName = new Map();
  header.forEach((name, idx) => indexByName.set(name, idx));
  const get = (row, key) => row[indexByName.get(key) ?? -1] ?? '';

  const nowIso = new Date().toISOString();
  const councils = [];
  const skipped = [];
  const seenIds = new Set();
  for (const line of lines.slice(2)) {
    const row = parseCsvLine(line);
    const abs = get(row, 'ABS');
    const name = get(row, 'ORGNAME');
    if (!abs || !name) {
      skipped.push({ reason: 'missing_abs_or_name', abs, name });
      continue;
    }

    const state = mapState(get(row, 'POSTAL_STATE'));
    if (!state) {
      skipped.push({ reason: 'invalid_state', abs, state: get(row, 'POSTAL_STATE') });
      continue;
    }
    const suburb = get(row, 'POSTAL_SUBURB') || get(row, 'STREET_SUBURB') || 'Unknown';
    const postcodeNum = Number.parseInt(get(row, 'POSTAL_PCODE') || get(row, 'STREET_PCODE'), 10);
    const postcode = Number.isFinite(postcodeNum) ? postcodeNum : 2000;
    const id = councilIdFromAbs(abs);
    if (seenIds.has(id)) {
      skipped.push({ reason: 'duplicate_abs', abs, id });
      continue;
    }
    seenIds.add(id);

    councils.push({
      id,
      name,
      abn: get(row, 'ABN') || undefined,
      state,
      lgaCode: abs,
      websiteUrl: asWebsite(get(row, 'WEB')),
      email: get(row, 'EMAIL') || undefined,
      phone: get(row, 'PHONE') || undefined,
      addressLine1: get(row, 'STREET_ADD1') || get(row, 'POSTAL_ADD1') || undefined,
      suburb,
      postcode,
      country: 'Australia',
      description: `${name} local government services and community programs.`,
      verificationStatus: 'unverified',
      status: 'active',
      servicePostcodes: [postcode],
      serviceSuburbs: [suburb],
      serviceCities: [suburb],
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }
  return { councils, skipped };
}

async function run() {
  if (!admin.apps.length) {
    const options = {};
    if (process.env.FIREBASE_PROJECT_ID) {
      options.projectId = process.env.FIREBASE_PROJECT_ID;
    }
    admin.initializeApp(options);
  }
  const db = admin.firestore();

  const csvPath = process.env.COUNCILS_CSV_PATH
    ? path.resolve(process.cwd(), process.env.COUNCILS_CSV_PATH)
    : path.resolve(__dirname, '../src/data/AllCouncilsList.csv');  // Using __dirname should work in CommonJS

  const { councils, skipped } = loadCouncilsFromCsv(csvPath);
  if (councils.length === 0) {
    throw new Error('No councils parsed from CSV.');
  }

  const byState = councils.reduce((acc, c) => {
    acc[c.state] = (acc[c.state] || 0) + 1;
    return acc;
  }, {});

  const dryRun = process.argv.includes('--dry-run');
  const allowLimitedStates = process.argv.includes('--allow-limited-states');
  const minRecords = Number.parseInt(process.env.COUNCILS_MIN_RECORDS || '300', 10);
  const minStates = Number.parseInt(process.env.COUNCILS_MIN_STATES || '6', 10);
  const statesPresent = Object.keys(byState);
  const datasetVersion = process.env.COUNCIL_DATASET_VERSION || new Date().toISOString().slice(0, 10);
  const sourceLabel = process.env.COUNCIL_DATASET_SOURCE || path.basename(csvPath);
  const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(csvPath)).digest('hex');

  if (!allowLimitedStates && councils.length < minRecords) {
    throw new Error(
      `Parsed only ${councils.length} councils (minimum ${minRecords}). Verify CSV path/content.`
    );
  }
  if (!allowLimitedStates && statesPresent.length < minStates) {
    throw new Error(
      `Parsed councils in only ${statesPresent.length} states (${statesPresent.join(', ')}). Minimum required: ${minStates}. ` +
      'Use --allow-limited-states only for local/dev tests.'
    );
  }

  console.log(`[councils-seed] parsed ${councils.length} councils`);
  console.log('[councils-seed] by state:', byState);
  console.log(`[councils-seed] skipped rows: ${skipped.length}`);
  console.log(`[councils-seed] dataset version: ${datasetVersion}`);
  console.log(`[councils-seed] source: ${sourceLabel}`);
  console.log(`[councils-seed] source sha256: ${sourceSha256}`);
  if (dryRun) {
    console.log('[councils-seed] dry-run complete (no writes).');
    return;
  }

  let batch = db.batch();
  let count = 0;
  let written = 0;
  for (const council of councils) {
    const ref = db.collection('councils').doc(council.id);
    batch.set(ref, council, { merge: true });
    count += 1;
    written += 1;
    if (count === 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }

  await db.collection('_meta').doc('councilsDataset').set(
    {
      datasetVersion,
      source: sourceLabel,
      sourceSha256,
      recordCount: councils.length,
      statesPresent,
      stateBreakdown: byState,
      skippedRows: skipped.length,
      uploadedAt: new Date().toISOString(),
      uploadedBy: process.env.COUNCILS_UPLOADED_BY || 'script',
      collection: 'councils',
      permanent: true,
    },
    { merge: true }
  );

  console.log(`[councils-seed] wrote ${written} councils to Firestore collection "councils".`);
  console.log('[councils-seed] updated metadata at _meta/councilsDataset.');
}

run().catch((error) => {
  console.error('[councils-seed] failed:', error);
  process.exitCode = 1;
});
