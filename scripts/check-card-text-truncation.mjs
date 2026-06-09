#!/usr/bin/env node
/**
 * Ratchets untruncated <Text> usage in high-risk card/list surfaces (FIXES-001 P5).
 * Prefer TruncatedText or numberOfLines on titles, bios, and metadata rows.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Per-file budgets — lower over time as surfaces are cleaned. */
const WATCHLIST_BUDGETS = {
  'src/modules/profile/components/tabs/EntityPublicProfile.tsx': 0,
  'src/modules/profile/components/tabs/ProfileComponents.tsx': 0,
  'src/modules/profile/components/tabs/UserPublicProfile.tsx': 0,
  'src/modules/profile/components/private/GuestProfileView.tsx': 0,
  'src/modules/marketplace/MarketplaceSquareTile.tsx': 0,
  'src/modules/marketplace/DailyDealSquareTile.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileHeroSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileBioRootsSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileMembershipSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileStatsActivitySection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileIdentityContactSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileLinksSection.tsx': 0,
  'src/modules/profile/components/tabs/sections/ProfileSignOutSection.tsx': 0,
  'src/modules/profile/components/TeamManagementModal.tsx': 0,
  'src/modules/profile/components/ProfileHeaderBar.tsx': 0,
  'src/app/user/[id].tsx': 0,
  'src/components/connect/ConnectTeaser.tsx': 0,
  'src/modules/communities/components/detail/CommunityWebDesktopLayout.tsx': 0,
  'src/app/saved/index.tsx': 0,
  'src/components/Discover/CultureWheelModal.tsx': 0,
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

function countUntruncatedText(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return 0;
  let text = fs.readFileSync(full, 'utf8');
  text = text.replace(/<TruncatedText[\s\S]*?<\/TruncatedText>/g, '');
  const tags = [...text.matchAll(/<Text\b([^>/]*)(?:\/>|>)/g)];
  return tags.filter((m) => !m[1].includes('numberOfLines')).length;
}

const failures = [];
for (const [file, budget] of Object.entries(WATCHLIST_BUDGETS)) {
  const count = countUntruncatedText(file);
  if (count > budget) failures.push({ file, count, budget });
}

console.log('Card/list Text truncation watchlist:');
for (const [file, budget] of Object.entries(WATCHLIST_BUDGETS)) {
  const count = countUntruncatedText(file);
  console.log(`  ${count.toString().padStart(3)} / ${budget}  ${file}`);
}

if (failures.length) {
  console.error('\n❌ Untruncated <Text> budget exceeded. Add numberOfLines or TruncatedText.');
  failures.forEach((f) => console.error(`  ${f.file}: ${f.count} > ${f.budget}`));
  process.exit(1);
}

console.log('\n✅ Text truncation watchlist passed.');