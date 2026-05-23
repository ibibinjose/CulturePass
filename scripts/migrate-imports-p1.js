const fs = require('fs');
const path = require('path');

const DIRS_TO_SCAN = ['src', 'components', 'features', 'hooks', 'lib', 'contexts'];

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

const tokensToMove = ['colors', 'theme', 'spacing', 'typography', 'elevation', 'animations', 'vitrineTheme'];

let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Replace components/ui imports
  content = content.replace(/@\/components\/ui/g, '@/design-system/ui');
  // Also handle relative imports if any exist, though most should use @
  content = content.replace(/from ['"](?:\.\.\/)+components\/ui/g, `from '@/design-system/ui`);

  // Replace token imports
  for (const token of tokensToMove) {
    const regex = new RegExp(`@\\/constants\\/${token}`, 'g');
    content = content.replace(regex, `@/design-system/tokens/${token}`);
    
    // Handle relative imports
    const relRegex = new RegExp(`from ['"](?:\\.\\.\\/)+constants\\/${token}['"]`, 'g');
    content = content.replace(relRegex, `from '@/design-system/tokens/${token}'`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
  }
}

console.log(`Updated imports in ${modifiedCount} files.`);
