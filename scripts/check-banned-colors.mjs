#!/usr/bin/env node
/**
 * Fails CI if deprecated yellow/saffron/gold hex literals reappear in src.
 * Canonical palette: docs/COLOR_PALETTE.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

/** Deprecated hues — do not use. See brandCyanPalette.ts */
const BANNED_HEX = [
  '#F5A623', '#D4A017', '#FFC857', '#E5A93B', '#FFF2B2', '#C59024', '#FBEAA1', '#9E6D0F',
  '#FFD54F', '#FFB300', '#FF9A00', '#FCD400', '#E6A900', '#FBBF24', '#F59E0B',
  '#FF9800', '#D97706', '#EA580C', '#EAB308', '#D4AF37', '#5C4008', '#3D2A05',
];

const BANNED_RGBA = [
  'rgba(245, 166, 35',
  'rgba(212, 160, 23',
  'rgba(255, 200, 87',
];

const ALLOWLIST_FILES = new Set([
  'src/design-system/tokens/brandCyanPalette.ts',
  'src/design-system/tokens/brandWordmarkPalette.ts',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(full, out);
      continue;
    }
    if (/\.(tsx?|jsx?|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const offenders = [];

for (const file of walk(srcDir)) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (ALLOWLIST_FILES.has(rel) && line.includes('DO NOT reintroduce')) return;
    const upper = line.toUpperCase();
    for (const hex of BANNED_HEX) {
      if (upper.includes(hex)) {
        offenders.push({ file: rel, line: idx + 1, match: hex });
      }
    }
    for (const rgba of BANNED_RGBA) {
      if (line.includes(rgba)) {
        offenders.push({ file: rel, line: idx + 1, match: rgba });
      }
    }
  });
}

if (offenders.length) {
  console.error('\n❌ Deprecated yellow/saffron/gold colors found:');
  offenders.forEach((o) => console.error(`  ${o.file}:${o.line}  ${o.match}`));
  console.error('\nUse BRAND_CYAN (#00ADEF), BRAND_CYAN_DEEP (#00A7EF), JET_BLACK — see docs/COLOR_PALETTE.md');
  process.exit(1);
}

console.log('✅ Banned color check passed (no deprecated yellow/saffron/gold literals).');