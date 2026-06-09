#!/usr/bin/env node
/**
 * Flags raw hex color literals outside approved token/theme files (FIXES-001 PR 5).
 * Usage: node scripts/check-hex-outside-tokens.mjs
 *
 * P4: qa:solid gates on FIXES watchlist per-file budgets (ratchet down over time).
 * Global total is reported for visibility but does not fail the check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

const ALLOWED_PATH_FRAGMENTS = [
  '/design-system/tokens/',
  'luxeHeritage.ts',
  'material3.ts',
  'colors.ts',
  'theme.ts',
  'vitrine',
  'profile/qr.tsx',
];

/** FIXES-001 remediation watchlist — ratchet budgets to 0 as files are cleaned. */
const WATCHLIST_BUDGETS = {
  'src/app/admin/users.tsx': 0,
  'src/modules/host/components/EntityTypeSelector.tsx': 0,
  'src/modules/host/components/steps/Step3Legal.tsx': 0,
  'src/modules/host/components/DraftRecoveryModal.tsx': 0,
  'src/modules/marketplace/MarketplaceSquareTile.tsx': 0,
  'src/modules/marketplace/DailyDealSquareTile.tsx': 0,
  'src/modules/profile/components/tabs/EntityPublicProfile.tsx': 0,
  'src/modules/profile/components/tabs/ProfileComponents.tsx': 0,
  'src/modules/profile/components/tabs/UserPublicProfile.tsx': 0,
  'src/modules/profile/components/private/GuestProfileView.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileHeroSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileBioRootsSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileMembershipSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileStatsActivitySection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileIdentityContactSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileLinksSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileSignOutSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileActionButtons.tsx': 0,
  'src/modules/profile/components/TeamManagementModal.tsx': 0,
  'src/modules/profile/components/ProfileHeaderBar.tsx': 0,
  'src/app/user/[id].tsx': 0,
  'src/components/connect/ConnectTeaser.tsx': 0,
  'src/modules/communities/components/detail/CommunityWebDesktopLayout.tsx': 0,
  'src/app/saved/index.tsx': 0,
  'src/components/Discover/CultureWheelModal.tsx': 0,
  'src/lib/defaultImages.ts': 0,
  'src/app/(tabs)/index.tsx': 0,
  'src/modules/host/components/HostspaceEventCreateForm.tsx': 0,
  'src/app/CultureMarket/index.tsx': 0,
  'src/modules/host/components/HostspaceCommunityCreateForm.tsx': 0,
  'src/app/membership/upgrade.tsx': 0,
  'src/app/tickets/print/[id].tsx': 0,
  'src/modules/core/layout/web/WebTopBar.tsx': 0,
  'src/modules/profile/components/tabs/ProfileStyles.ts': 0,
  'src/app/settings/account.tsx': 0,
};

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;

function isAllowed(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  return ALLOWED_PATH_FRAGMENTS.some((frag) => rel.includes(frag));
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(full, out);
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const offenders = [];
const countsByRel = {};

for (const file of walk(srcDir)) {
  if (isAllowed(file)) continue;
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  const matches = text.match(HEX_RE);
  if (matches?.length) {
    offenders.push({ file: rel, count: matches.length });
    countsByRel[rel] = matches.length;
  }
}

offenders.sort((a, b) => b.count - a.count);
const total = offenders.reduce((sum, o) => sum + o.count, 0);

console.log(`Hex literals outside token files: ${total} (global informational)`);
if (offenders.length) {
  console.log('\nTop offenders:');
  offenders.slice(0, 12).forEach((o) => console.log(`  ${o.count.toString().padStart(4)}  ${o.file}`));
}

const watchlistFailures = Object.entries(WATCHLIST_BUDGETS).filter(([file, budget]) => {
  const count = countsByRel[file] ?? 0;
  return count > budget;
});

if (watchlistFailures.length) {
  console.error('\n❌ FIXES watchlist hex budget exceeded:');
  watchlistFailures.forEach(([file, budget]) => {
    const count = countsByRel[file] ?? 0;
    console.error(`  ${file}: ${count} > ${budget}`);
  });
  process.exit(1);
}

console.log('\n✅ Hex watchlist check passed.');
if (Object.keys(WATCHLIST_BUDGETS).length) {
  console.log('Watchlist (all within budget):');
  Object.entries(WATCHLIST_BUDGETS).forEach(([file, budget]) => {
    const count = countsByRel[file] ?? 0;
    console.log(`  ${count.toString().padStart(3)} / ${budget}  ${file}`);
  });
}