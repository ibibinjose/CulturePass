const fs = require('fs');
const path = require('path');

const DIRS_TO_SCAN = ['src', 'components', 'features', 'hooks', 'lib', 'contexts'];

// Step 1: Move files
const moves = [
  ['components/community-create', 'src/modules/communities/components/create'],
  ['components/community', 'src/modules/communities/components/detail'],
  ['components/CommunityCardSkeleton.tsx', 'src/modules/communities/components/CommunityCardSkeleton.tsx'],
  ['components/CommunityListSkeleton.tsx', 'src/modules/communities/components/CommunityListSkeleton.tsx'],
  ['hooks/queries/useCommunities.ts', 'src/modules/communities/hooks/useCommunities.ts']
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
    { from: /@\/components\/community-create/g, to: '@/modules/communities/components/create' },
    { from: /@\/components\/community([^"-])/g, to: '@/modules/communities/components/detail$1' },
    { from: /@\/components\/CommunityCardSkeleton/g, to: '@/modules/communities/components/CommunityCardSkeleton' },
    { from: /@\/components\/CommunityListSkeleton/g, to: '@/modules/communities/components/CommunityListSkeleton' },
    { from: /@\/hooks\/queries\/useCommunities/g, to: '@/modules/communities/hooks/useCommunities' },
    
    // Relative paths
    { from: /from ['"](?:\.\.\/)+components\/community-create/g, to: `from '@/modules/communities/components/create` },
    { from: /from ['"](?:\.\.\/)+components\/community/g, to: `from '@/modules/communities/components/detail` },
    { from: /from ['"](?:\.\.\/)+components\/CommunityCardSkeleton/g, to: `from '@/modules/communities/components/CommunityCardSkeleton` },
    { from: /from ['"](?:\.\.\/)+components\/CommunityListSkeleton/g, to: `from '@/modules/communities/components/CommunityListSkeleton` },
    { from: /from ['"](?:\.\.\/)+hooks\/queries\/useCommunities/g, to: `from '@/modules/communities/hooks/useCommunities` }
  ];

  for (const r of replacements) {
    content = content.replace(r.from, r.to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
  }
}

console.log(`Updated community imports in ${modifiedCount} files.`);
