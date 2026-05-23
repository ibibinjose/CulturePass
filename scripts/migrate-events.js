const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIRS_TO_SCAN = ['src', 'components', 'features', 'hooks', 'lib', 'contexts'];

// Step 1: Move files
const moves = [
  ['components/event-create', 'src/modules/events/components/create'],
  ['components/event-detail', 'src/modules/events/components/detail'],
  ['components/events', 'src/modules/events/components/list'],
  ['components/EventCard.tsx', 'src/modules/events/components/EventCard.tsx'],
  ['components/EventCardV1.tsx', 'src/modules/events/components/EventCardV1.tsx'],
  ['components/EventCardV2.tsx', 'src/modules/events/components/EventCardV2.tsx'],
  ['components/EventCardSkeleton.tsx', 'src/modules/events/components/EventCardSkeleton.tsx'],
  ['hooks/queries/useEvents.ts', 'src/modules/events/hooks/useEvents.ts'],
  ['hooks/useNearbyEvents.ts', 'src/modules/events/hooks/useNearbyEvents.ts']
];

for (const [src, dest] of moves) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    console.log(`Moved ${src} to ${dest}`);
  }
}

// Step 2: Update imports
function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = DIRS_TO_SCAN.reduce((acc, dir) => acc.concat(walk(dir)), []);
let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Replacements
  const replacements = [
    { from: /@\/components\/event-create/g, to: '@/modules/events/components/create' },
    { from: /@\/components\/event-detail/g, to: '@/modules/events/components/detail' },
    { from: /@\/components\/events/g, to: '@/modules/events/components/list' },
    { from: /@\/components\/EventCard([^"']*)/g, to: '@/modules/events/components/EventCard$1' },
    { from: /@\/hooks\/queries\/useEvents/g, to: '@/modules/events/hooks/useEvents' },
    { from: /@\/hooks\/useNearbyEvents/g, to: '@/modules/events/hooks/useNearbyEvents' },
    
    // Relative paths (best effort)
    { from: /from ['"](?:\.\.\/)+components\/event-create/g, to: `from '@/modules/events/components/create` },
    { from: /from ['"](?:\.\.\/)+components\/event-detail/g, to: `from '@/modules/events/components/detail` },
    { from: /from ['"](?:\.\.\/)+components\/events/g, to: `from '@/modules/events/components/list` },
    { from: /from ['"](?:\.\.\/)+components\/EventCard([^"']*)/g, to: `from '@/modules/events/components/EventCard$1` },
    { from: /from ['"](?:\.\.\/)+hooks\/queries\/useEvents['"]/g, to: `from '@/modules/events/hooks/useEvents'` },
    { from: /from ['"](?:\.\.\/)+hooks\/useNearbyEvents['"]/g, to: `from '@/modules/events/hooks/useNearbyEvents'` }
  ];

  for (const r of replacements) {
    content = content.replace(r.from, r.to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
  }
}

console.log(`Updated event imports in ${modifiedCount} files.`);
