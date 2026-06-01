#!/usr/bin/env node

/**
 * Basic Web Bundle Size Checker for CulturePass (Phase 0)
 *
 * Enforces a soft performance budget on the web export.
 * This is a starting point — elite teams (Google, Apple, etc.) have much more
 * sophisticated RUM + bundle analysis, but this is a strong foundation.
 *
 * Usage:
 *   npm run size:web
 *
 * Exit codes:
 *   0 = OK
 *   1 = Over hard budget (fail CI)
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { gzip } = require('zlib');

const gzipAsync = promisify(gzip);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const JS_DIR = path.join(DIST_DIR, '_expo', 'static', 'js', 'web');

// Performance budgets (industry best practice: measure gzipped)
const SOFT_BUDGET_KB = 1400;   // Warning: 1.4 MB gzipped
const HARD_BUDGET_KB = 2000;   // Fail: 2.0 MB gzipped (very noticeable impact)

function getAllJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllJsFiles(fullPath);
      }
      if (entry.name.endsWith('.js')) {
        return [fullPath];
      }
      return [];
    });
}

function formatKB(bytes) {
  return (bytes / 1024).toFixed(0) + ' KB';
}

async function main() {
  console.log('📦 Checking web bundle size...\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ folder not found. Run `npm run build-web` first.');
    process.exit(1);
  }

  const jsFiles = getAllJsFiles(JS_DIR);

  if (jsFiles.length === 0) {
    console.error('❌ No JS bundles found in web export.');
    process.exit(1);
  }

  // Calculate both raw and gzipped sizes (gzipped is what actually matters for load time)
  const sizes = await Promise.all(jsFiles.map(async (file) => {
    const buffer = fs.readFileSync(file);
    const gzipped = await gzipAsync(buffer);
    return {
      file: path.relative(DIST_DIR, file),
      size: buffer.length,
      gzippedSize: gzipped.length,
    };
  }));

  sizes.sort((a, b) => b.gzippedSize - a.gzippedSize);

  const largest = sizes[0];
  const totalRaw = sizes.reduce((sum, s) => sum + s.size, 0);
  const totalGzipped = sizes.reduce((sum, s) => sum + s.gzippedSize, 0);

  console.log(`Largest chunk: ${largest.file}`);
  console.log(`  Raw:      ${formatKB(largest.size)}`);
  console.log(`  Gzipped:  ${formatKB(largest.gzippedSize)} (what users actually download)\n`);

  console.log(`Total JS across all chunks:`);
  console.log(`  Raw:      ${formatKB(totalRaw)}`);
  console.log(`  Gzipped:  ${formatKB(totalGzipped)}\n`);

  const largestGzipKB = Math.round(largest.gzippedSize / 1024);
  const totalGzipKB = Math.round(totalGzipped / 1024);

  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  if (largestGzipKB > HARD_BUDGET_KB) {
    const msg = `HARD BUDGET EXCEEDED: Largest gzipped chunk is ${largestGzipKB} KB (limit ${HARD_BUDGET_KB} KB)`;
    console.error(`❌ ${msg}`);
    if (isCI) {
      console.log(`::error title=Bundle Size::${msg}`);
    }
    process.exit(1);
  }

  if (largestGzipKB > SOFT_BUDGET_KB) {
    const msg = `SOFT BUDGET WARNING: Largest gzipped chunk is ${largestGzipKB} KB (soft limit ${SOFT_BUDGET_KB} KB)`;
    console.warn(`⚠️  ${msg}`);
    if (isCI) {
      console.log(`::warning title=Bundle Size::${msg} — Consider code splitting.`);
    }
  } else {
    console.log(`✅ Bundle size within budget (largest gzipped chunk: ${largestGzipKB} KB)`);
  }

  console.log('\nTop 5 largest chunks (by gzipped size):');
  sizes.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.file}`);
    console.log(`      Raw: ${formatKB(s.size)} → Gzipped: ${formatKB(s.gzippedSize)}`);
  });
}

main().catch((err) => {
  console.error('Bundle size check failed:', err);
  process.exit(1);
});