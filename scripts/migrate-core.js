const fs = require('fs');
const path = require('path');

const DIRS_TO_SCAN = ['src', 'components', 'features', 'hooks', 'lib', 'contexts'];

// Step 1: Move files
const moves = [
  ['components/AuthGuard.tsx', 'src/modules/core/auth/AuthGuard.tsx'],
  ['components/ErrorBoundary.tsx', 'src/modules/core/ui/ErrorBoundary.tsx'],
  ['components/ErrorFallback.tsx', 'src/modules/core/ui/ErrorFallback.tsx'],
  ['components/AppHeaderBar.tsx', 'src/modules/core/ui/AppHeaderBar.tsx'],
  ['components/HeaderLogo.tsx', 'src/modules/core/ui/HeaderLogo.tsx'],
  ['components/tabs', 'src/modules/core/layout/tabs'],
  ['components/web', 'src/modules/core/layout/web'],
  ['components/navigation', 'src/modules/core/navigation']
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
    { from: /@\/components\/AuthGuard/g, to: '@/modules/core/auth/AuthGuard' },
    { from: /@\/components\/ErrorBoundary/g, to: '@/modules/core/ui/ErrorBoundary' },
    { from: /@\/components\/ErrorFallback/g, to: '@/modules/core/ui/ErrorFallback' },
    { from: /@\/components\/AppHeaderBar/g, to: '@/modules/core/ui/AppHeaderBar' },
    { from: /@\/components\/HeaderLogo/g, to: '@/modules/core/ui/HeaderLogo' },
    { from: /@\/components\/tabs/g, to: '@/modules/core/layout/tabs' },
    { from: /@\/components\/web/g, to: '@/modules/core/layout/web' },
    { from: /@\/components\/navigation/g, to: '@/modules/core/navigation' },
    
    // Relative paths
    { from: /from ['"](?:\.\.\/)+components\/AuthGuard/g, to: `from '@/modules/core/auth/AuthGuard` },
    { from: /from ['"](?:\.\.\/)+components\/ErrorBoundary/g, to: `from '@/modules/core/ui/ErrorBoundary` },
    { from: /from ['"](?:\.\.\/)+components\/ErrorFallback/g, to: `from '@/modules/core/ui/ErrorFallback` },
    { from: /from ['"](?:\.\.\/)+components\/AppHeaderBar/g, to: `from '@/modules/core/ui/AppHeaderBar` },
    { from: /from ['"](?:\.\.\/)+components\/HeaderLogo/g, to: `from '@/modules/core/ui/HeaderLogo` },
    { from: /from ['"](?:\.\.\/)+components\/tabs/g, to: `from '@/modules/core/layout/tabs` },
    { from: /from ['"](?:\.\.\/)+components\/web/g, to: `from '@/modules/core/layout/web` },
    { from: /from ['"](?:\.\.\/)+components\/navigation/g, to: `from '@/modules/core/navigation` }
  ];

  for (const r of replacements) {
    content = content.replace(r.from, r.to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
  }
}

console.log(`Updated core imports in ${modifiedCount} files.`);
