const fs = require('fs');
const path = require('path');

const nodeModulesDir = path.join(__dirname, '..', 'node_modules');

// --- Fast-fail health checks ---
const requiredPaths = [
  { rel: 'node_modules/.bin/tsc',              label: '.bin/tsc (TypeScript compiler symlink)' },
  { rel: 'node_modules/.bin/expo',             label: '.bin/expo (Expo CLI symlink)' },
  { rel: 'node_modules/.bin/jest',             label: '.bin/jest (Jest symlink)' },
  { rel: 'node_modules/typescript/lib/tsc.js', label: 'typescript/lib/tsc.js (TypeScript install)' },
];

const projectRoot = path.join(__dirname, '..');
let healthCheckFailed = false;

for (const { rel, label } of requiredPaths) {
  const fullPath = path.join(projectRoot, rel);
  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: Required path missing: ${label}`);
    console.error(`  Expected at: ${fullPath}`);
    console.error('  Run "npm install" (with Node 22) to restore node_modules.');
    healthCheckFailed = true;
  }
}

if (healthCheckFailed) {
  process.exit(1);
}

// --- Corrupt-package scan (runs only when health checks pass) ---

function checkPackage(packagePath, relativeName) {
  const pkgJsonPath = path.join(packagePath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    return;
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    let mainFile = pkg.main || 'index.js';
    let resolvedPath = path.resolve(packagePath, mainFile);
    
    // Check if resolvedPath exists, if not try appending .js, /index.js, etc.
    let exists = fs.existsSync(resolvedPath);
    if (!exists) {
      const candidates = [
        resolvedPath + '.js',
        resolvedPath + '/index.js',
        path.join(resolvedPath, 'index.js'),
        resolvedPath + '.cjs',
        resolvedPath + '.mjs',
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          exists = true;
          break;
        }
      }
    }
    
    if (!exists) {
      console.log(`Corrupt package (missing main): ${relativeName} (main: ${mainFile})`);
      return false;
    }

    // Verify typings file if specified
    const typingsFile = pkg.typings || pkg.types;
    if (typingsFile) {
      const resolvedTypings = path.resolve(packagePath, typingsFile);
      if (!fs.existsSync(resolvedTypings)) {
        console.log(`Corrupt package (missing typings): ${relativeName} (typings: ${typingsFile})`);
        return false;
      }
    }
  } catch (err) {
    console.log(`Corrupt package (invalid package.json): ${relativeName} - ${err.message}`);
    return false;
  }
  return true;
}

function scanDir(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name.startsWith('.')) continue;
    
    if (name.startsWith('@')) {
      // Scoped package
      scanDir(path.join(dir, name), name + '/');
    } else {
      const relativeName = prefix + name;
      const fullPath = path.join(dir, name);
      const ok = checkPackage(fullPath, relativeName);
      if (ok === false) {
        console.log(`DELETING corrupt package: ${fullPath}`);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (rmErr) {
          console.error(`Failed to delete ${fullPath}: ${rmErr.message}`);
        }
      }
    }
  }
}

console.log('Scanning node_modules...');
scanDir(nodeModulesDir);
console.log('Scan completed.');
console.log('node_modules health check passed');
process.exit(0);
