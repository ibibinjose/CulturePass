const fs = require('fs');
const path = require('path');

const DIRS_TO_SCAN = ['src', 'components', 'features', 'hooks', 'lib', 'contexts'];

// Step 1: Move files
const moves = [
  ['components/profile', 'src/modules/profile/components/private'],
  ['components/profile-public', 'src/modules/profile/components/public'],
  ['components/profile-tabs', 'src/modules/profile/components/tabs'],
  ['components/user', 'src/modules/profile/components/user'],
  ['components/ProfileHeaderBar.tsx', 'src/modules/profile/components/ProfileHeaderBar.tsx'],
  ['components/ProfileQuickMenu.tsx', 'src/modules/profile/components/ProfileQuickMenu.tsx'],
  ['hooks/useProfile.ts', 'src/modules/profile/hooks/useProfile.ts']
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
    { from: /@\/components\/profile-public/g, to: '@/modules/profile/components/public' },
    { from: /@\/components\/profile-tabs/g, to: '@/modules/profile/components/tabs' },
    { from: /@\/components\/profile([^a-zA-Z0-9_-])/g, to: '@/modules/profile/components/private$1' },
    { from: /@\/components\/user([^a-zA-Z0-9_-])/g, to: '@/modules/profile/components/user$1' },
    { from: /@\/components\/ProfileHeaderBar/g, to: '@/modules/profile/components/ProfileHeaderBar' },
    { from: /@\/components\/ProfileQuickMenu/g, to: '@/modules/profile/components/ProfileQuickMenu' },
    { from: /@\/hooks\/useProfile/g, to: '@/modules/profile/hooks/useProfile' },
    
    // Relative paths
    { from: /from ['"](?:\.\.\/)+components\/profile-public/g, to: `from '@/modules/profile/components/public` },
    { from: /from ['"](?:\.\.\/)+components\/profile-tabs/g, to: `from '@/modules/profile/components/tabs` },
    { from: /from ['"](?:\.\.\/)+components\/profile['"]/g, to: `from '@/modules/profile/components/private'` },
    { from: /from ['"](?:\.\.\/)+components\/user['"]/g, to: `from '@/modules/profile/components/user'` },
    { from: /from ['"](?:\.\.\/)+components\/ProfileHeaderBar/g, to: `from '@/modules/profile/components/ProfileHeaderBar` },
    { from: /from ['"](?:\.\.\/)+components\/ProfileQuickMenu/g, to: `from '@/modules/profile/components/ProfileQuickMenu` },
    { from: /from ['"](?:\.\.\/)+hooks\/useProfile/g, to: `from '@/modules/profile/hooks/useProfile` }
  ];

  for (const r of replacements) {
    content = content.replace(r.from, r.to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
  }
}

console.log(`Updated profile imports in ${modifiedCount} files.`);
