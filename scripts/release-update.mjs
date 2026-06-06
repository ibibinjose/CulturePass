import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();

// 1. Read package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version;
console.log(`Current version: ${currentVersion}`);

// 2. Compute next patch version
const versionParts = currentVersion.split('.').map(Number);
versionParts[2] += 1;
const nextVersion = versionParts.join('.');
console.log(`Next patch version: ${nextVersion}`);

// 3. Update package.json
pkg.version = nextVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`Updated package.json to ${nextVersion}`);

// 4. Update app.config.js
const appConfigPath = path.join(rootDir, 'app.config.js');
let appConfig = fs.readFileSync(appConfigPath, 'utf8');
const versionRegex = /(version:\s*["'])[0-9]+\.[0-9]+\.[0-9]+(["'])/;
if (versionRegex.test(appConfig)) {
  appConfig = appConfig.replace(versionRegex, `$1${nextVersion}$2`);
  fs.writeFileSync(appConfigPath, appConfig, 'utf8');
  console.log(`Updated app.config.js to ${nextVersion}`);
} else {
  console.warn('Could not find version string in app.config.js to update!');
}

// 5. Update CHANGELOG.md
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

const today = new Date().toISOString().split('T')[0];
const releaseSection = `## [${nextVersion}] - ${today}

### Added
- **Premium Directory UI/UX**: Rebuilt the Directory screen at \`/directory\` with a responsive grid (3-column layout on desktop, 2-column on tablet, 1-column on mobile), split banner/avatar card styles, and VIP horizontal carousels (Featured and Community).
- **Interactive Location Selection**: Integrated \`LocationPickerModal\` and \`useLocationPickerFlow\` directly into the Directory screen, making the header location badge clickable and automatically updating search queries.
- **Improved Test Run Quality**: Mocked the \`firebase-functions\` logger in file validation service tests to suppress warning logs in console outputs.
- **Dependency Security Fixes**: Resolved 16 security vulnerability alerts by specifying overrides for \`@xmldom/xmldom\` and \`uuid\` packages.

### Fixed
- **EAS Build Upload Casing**: Resolved git/filesystem naming casing mismatch for \`cpu/[id].tsx\` and \`(shortlinks)/cpu/[id].tsx\` that caused build failures on macOS.
`;

const insertIndex = changelog.indexOf('## [Unreleased]');
if (insertIndex !== -1) {
  const insertionPoint = insertIndex + '## [Unreleased]\n\n'.length;
  changelog = changelog.slice(0, insertionPoint) + releaseSection + '\n' + changelog.slice(insertionPoint);
  fs.writeFileSync(changelogPath, changelog, 'utf8');
  console.log(`Updated CHANGELOG.md with release section for ${nextVersion}`);
} else {
  console.warn('Could not find ## [Unreleased] section in CHANGELOG.md to update!');
}

// 6. Run QA commands
console.log('\nRunning QA check suite (typecheck, lint, test)...');
try {
  execSync('npm run qa:solid', { stdio: 'inherit', cwd: rootDir });
  console.log('\n✅ QA checks passed successfully!');
  
  // 7. Git commit
  console.log('\nCommitting version update to git...');
  execSync('git add package.json app.config.js CHANGELOG.md package-lock.json', { stdio: 'inherit', cwd: rootDir });
  execSync(`git commit -m "bump: version ${nextVersion} release and changelog update"`, { stdio: 'inherit', cwd: rootDir });
  console.log(`\n🎉 Successfully bumped version to ${nextVersion} and created git commit!`);
} catch (error) {
  console.error('\n❌ QA check suite failed! Version bumped but changes not committed.');
  process.exit(1);
}
