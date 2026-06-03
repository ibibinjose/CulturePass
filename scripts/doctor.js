#!/usr/bin/env node

/**
 * CulturePass Environment Doctor
 *
 * Run with: npm run doctor
 *
 * This script performs a series of checks to validate that your local
 * development environment is set up correctly for CulturePass.
 *
 * It is intentionally verbose and helpful. The goal is to reduce the
 * "nuclear cleanup" frequency documented in REBUILD.md.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REQUIRED_NODE_MAJOR = 22;
const REQUIRED_NODE_MINOR = 14;

const CHECKS = [];
let hasErrors = false;
let hasWarnings = false;

function logHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function pass(msg) {
  console.log(`✅  ${msg}`);
}

function warn(msg) {
  console.log(`⚠️   ${msg}`);
  hasWarnings = true;
}

function fail(msg) {
  console.log(`❌  ${msg}`);
  hasErrors = true;
}

function info(msg) {
  console.log(`ℹ️   ${msg}`);
}

function runCommand(cmd, options = {}) {
  try {
    return execSync(cmd, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options,
    });
  } catch (error) {
    if (!options.allowFailure) {
      throw error;
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Checks
// ─────────────────────────────────────────────────────────────────────────────

function checkNodeVersion() {
  logHeader('Node.js Version');

  const nodeVersion = process.version; // e.g. v22.14.0
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  const minor = parseInt(nodeVersion.slice(1).split('.')[1], 10);

  if (major > REQUIRED_NODE_MAJOR || (major === REQUIRED_NODE_MAJOR && minor >= REQUIRED_NODE_MINOR)) {
    pass(`Node.js ${nodeVersion} (required: >= ${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR})`);
  } else {
    fail(`Node.js ${nodeVersion} is too old. Please use Node ${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR}+ (via nvm/fnm recommended).`);
    info('  → Run: nvm install 22.14 && nvm use 22.14');
  }
}

function checkFirebaseCLI() {
  logHeader('Firebase CLI');

  try {
    const version = runCommand('firebase --version', { silent: true }).trim();
    pass(`Firebase CLI installed (${version})`);

    // Check if logged in (best effort)
    try {
      runCommand('firebase projects:list --json', { silent: true, stdio: 'pipe' });
      pass('Firebase CLI appears to be authenticated');
    } catch {
      warn('Firebase CLI may not be authenticated. Run: firebase login');
    }
  } catch {
    fail('Firebase CLI is not installed or not in PATH.');
    info('  → Run: npm install -g firebase-tools');
  }
}

function checkKeyPorts() {
  logHeader('Common Development Ports');

  const ports = [
    { port: 5000, service: 'Firebase Hosting (local)' },
    { port: 5001, service: 'Firebase Functions Emulator' },
    { port: 8080, service: 'Firestore Emulator' },
    { port: 9099, service: 'Firebase Auth Emulator' },
    { port: 9199, service: 'Firebase Storage Emulator' },
  ];

  ports.forEach(({ port, service }) => {
    try {
      // Simple port check using node net
      const net = require('net');
      const server = net.createServer();
      server.once('error', () => {
        warn(`Port ${port} (${service}) appears to be in use. This may be okay if emulators are running.`);
      });
      server.once('listening', () => {
        server.close();
        pass(`Port ${port} (${service}) is free`);
      });
      server.listen(port);
    } catch (e) {
      // Fallback message
      info(`Could not reliably check port ${port} (${service})`);
    }
  });
}

function checkEnvironmentVariables() {
  logHeader('Environment Variables');

  const requiredPublicVars = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  // Try parsing environment variables from local .env files
  const loadedEnv = { ...process.env };
  const envFiles = ['.env.local', '.env'];
  
  envFiles.forEach((file) => {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const firstEqual = trimmed.indexOf('=');
            if (firstEqual > 0) {
              const k = trimmed.substring(0, firstEqual).trim();
              const v = trimmed.substring(firstEqual + 1).trim().replace(/^['"]|['"]$/g, '');
              if (!loadedEnv[k]) {
                loadedEnv[k] = v;
              }
            }
          }
        });
      } catch (err) {
        // Ignore file read errors
      }
    }
  });

  let foundAny = false;

  requiredPublicVars.forEach((key) => {
    if (loadedEnv[key]) {
      const source = process.env[key] ? 'shell' : 'local env file';
      pass(`${key} is set (from ${source})`);
      foundAny = true;
    }
  });

  if (!foundAny) {
    warn('No EXPO_PUBLIC_* Firebase variables detected in current shell or .env files.');
    info('  For local development you typically need a .env file or exported variables.');
    info('  See app.config.js and src/lib/config.ts for how these are consumed.');
  }

  if (loadedEnv.FIREBASE_PROJECT_ID) {
    pass(`FIREBASE_PROJECT_ID = ${loadedEnv.FIREBASE_PROJECT_ID}`);
  }
}

function checkFirebaseConfig() {
  logHeader('Firebase Project Configuration');

  const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');

  if (fs.existsSync(firebaseJsonPath)) {
    pass('firebase.json exists');
    try {
      const config = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
      if (config.emulators) {
        pass('Emulator configuration found in firebase.json');
      }
    } catch {
      warn('Could not parse firebase.json');
    }
  } else {
    fail('firebase.json is missing from project root.');
  }
}

function checkPackageHealth() {
  logHeader('Package & Dependency Health');

  if (fs.existsSync('node_modules')) {
    pass('root node_modules exists');
  } else {
    fail('root node_modules is missing. Run: npm install --legacy-peer-deps');
  }

  const functionsNodeModules = path.join('functions', 'node_modules');
  if (fs.existsSync(functionsNodeModules)) {
    pass('functions/node_modules exists');
  } else {
    warn('functions/node_modules is missing. Run: cd functions && npm install --legacy-peer-deps');
  }
}

function checkCommonPainPoints() {
  logHeader('Known Pain Points (from REBUILD.md & experience)');

  // Apple targets
  const appConfigPath = path.join(process.cwd(), 'app.config.js');
  if (fs.existsSync(appConfigPath)) {
    const content = fs.readFileSync(appConfigPath, 'utf8');
    if (content.includes('@bacons/apple-targets')) {
      info('Apple Targets plugin is enabled. If prebuild fails, temporarily comment it out.');
    }
  }

  info('API URL resolution is complex. See src/lib/query-client.ts:resolveApiUrl()');
  info('For emulators: ensure EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true when appropriate.');
}

function printSummary() {
  logHeader('Summary');

  if (hasErrors) {
    console.log('❌  Doctor found errors that will likely prevent you from developing smoothly.');
    console.log('   Please address the ❌ items above before proceeding.');
  } else if (hasWarnings) {
    console.log('⚠️   Doctor found some warnings. You can probably develop, but things may be flaky.');
  } else {
    console.log('✅  Environment looks healthy. Great job!');
  }

  console.log('\nNext steps if you are still having issues:');
  console.log('  1. Review REBUILD.md for the nuclear cleanup procedure');
  console.log('  2. Run: npm run clean (if defined) or the steps in REBUILD.md');
  console.log('  3. Ask in the team channel with the full output of this script');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log('🩺  Running CulturePass Environment Doctor...\n');

  checkNodeVersion();
  checkFirebaseCLI();
  checkKeyPorts();
  checkEnvironmentVariables();
  checkFirebaseConfig();
  checkPackageHealth();
  checkCommonPainPoints();

  printSummary();

  if (hasErrors) {
    process.exit(1);
  }
}

main();