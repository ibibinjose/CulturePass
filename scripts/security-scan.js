#!/usr/bin/env node

/**
 * Security Scanning Script for CulturePass
 * Performs automated vulnerability scanning using multiple tools
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    log(colors.blue, `Running: ${command}`);
    const result = execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.stderr, error };
  }
}

function checkPrerequisites() {
  log(colors.cyan, 'Checking prerequisites...');
  
  // Check if npm is available
  const npmCheck = runCommand('npm --version');
  if (!npmCheck.success) {
    log(colors.red, 'ERROR: npm is not installed or not in PATH');
    return false;
  }
  
  log(colors.green, '✓ npm is available');
  
  // Check if package.json exists
  if (!fs.existsSync('./package.json')) {
    log(colors.red, 'ERROR: package.json not found in current directory');
    return false;
  }
  
  log(colors.green, '✓ package.json found');
  return true;
}

function runDependencyChecks() {
  log(colors.cyan, '\n=== Running Dependency Security Checks ===');
  
  // Root directory checks
  log(colors.yellow, '\n--- Checking root dependencies ---');
  try {
    const rootAudit = runCommand('npm audit --audit-level moderate --json --legacy-peer-deps');
    if (rootAudit.success) {
      const auditJson = JSON.parse(rootAudit.output);
      const { moderate, high, critical } = auditJson.metadata.vulnerabilities;
      
      if (moderate > 0 || high > 0 || critical > 0) {
        log(colors.red, `✗ Root dependency audit found vulnerabilities:`);
        log(colors.red, `  Critical: ${critical}, High: ${high}, Moderate: ${moderate}`);
        log(colors.yellow, '\nRecommendations:');
        log(colors.yellow, '1. Run `npm audit fix --legacy-peer-deps` to auto-fix fixable issues');
        log(colors.yellow, '2. Check for updates to packages with vulnerabilities:');
        log(colors.yellow, '   - uuid (bounds check issue)');
        log(colors.yellow, '   - any vulnerable dependencies in your package.json');
      } else {
        log(colors.green, '✓ Root dependency audit passed with no moderate/high/critical vulnerabilities');
      }
    } else {
      log(colors.red, `✗ Root dependency audit failed to execute: ${rootAudit.output}`);
    }
  } catch (error) {
    log(colors.red, `✗ Root dependency audit failed: ${error.message}`);
  }
  
  // Functions directory checks
  if (fs.existsSync('./functions/package.json')) {
    log(colors.yellow, '\n--- Checking functions dependencies ---');
    try {
      const functionsAudit = runCommand('npm audit --audit-level moderate --json --legacy-peer-deps', './functions');
      if (functionsAudit.success) {
        const auditJson = JSON.parse(functionsAudit.output);
        const { moderate, high, critical } = auditJson.metadata.vulnerabilities;
        
        if (moderate > 0 || high > 0 || critical > 0) {
          log(colors.red, `✗ Functions dependency audit found vulnerabilities:`);
          log(colors.red, `  Critical: ${critical}, High: ${high}, Moderate: ${moderate}`);
          log(colors.yellow, '\nRecommendations:');
          log(colors.yellow, '1. Run `npm audit fix --legacy-peer-deps` in functions directory');
          log(colors.yellow, '2. Check for updates to packages with vulnerabilities:');
          log(colors.yellow, '   - protobufjs (DoS issue)');
          log(colors.yellow, '   - qs package (DoS issue)');
          log(colors.yellow, '   - any other vulnerable dependencies');
        } else {
          log(colors.green, '✓ Functions dependency audit passed with no moderate/high/critical vulnerabilities');
        }
      } else {
        log(colors.red, `✗ Functions dependency audit failed to execute: ${functionsAudit.output}`);
      }
    } catch (error) {
      log(colors.red, `✗ Functions dependency audit failed: ${error.message}`);
    }
  } else {
    log(colors.yellow, '⚠ Functions directory or package.json not found - skipping functions audit');
  }
}

function runSAST() {
  log(colors.cyan, '\n=== Running Static Application Security Testing (SAST) ===');
  
  // Run ESLint security checks
  log(colors.yellow, '\n--- Running ESLint security checks ---');
  try {
    // First try with max-warnings=0 to fail on any warnings
    const eslintResult = runCommand('npm run lint -- --max-warnings 0 --legacy-peer-deps');
    if (eslintResult.success) {
      log(colors.green, '✓ ESLint security checks passed with no warnings');
    } else {
      log(colors.red, '✗ ESLint security scan failed due to warnings:');
      // Run again without --max-warnings to get detailed output
      const detailedResult = runCommand('npm run lint -- --legacy-peer-deps');
      console.log(detailedResult.output);
      log(colors.yellow, '\nRecommendations:');
      log(colors.yellow, '1. Run `npm run lint -- --fix --legacy-peer-deps` to auto-fix issues');
      log(colors.yellow, '2. Manually review remaining warnings for security concerns');
    }
  } catch (error) {
    log(colors.red, `✗ ESLint security scan failed: ${error.message}`);
  }
  
  // Run TypeScript type checks (potential security issues)
  log(colors.yellow, '\n--- Running TypeScript checks ---');
  const tscResult = runCommand('npm run typecheck');
  if (tscResult.success) {
    log(colors.green, '✓ TypeScript security checks passed');
  } else {
    log(colors.red, '✗ TypeScript found potential security issues (type mismatches, etc.)');
    console.log(tscResult.output);
    log(colors.yellow, '\nRecommendations:');
    log(colors.yellow, '1. Fix type errors to prevent potential security issues');
    log(colors.yellow, '2. Review any type assertions for potential vulnerabilities');
  }
}

function runUnitSecurityTests() {
  log(colors.cyan, '\n=== Running Security Unit Tests ===');
  
  const securityTestResult = runCommand('npm run test:unit');
  if (securityTestResult.success) {
    log(colors.green, '✓ Security unit tests passed');
  } else {
    log(colors.red, `✗ Security unit tests failed: ${securityTestResult.output}`);
  }
}

function runIntegrationSecurityTests() {
  log(colors.cyan, '\n=== Running Security Integration Tests ===');
  
  const integrationTestResult = runCommand('npm run test:integration');
  if (integrationTestResult.success) {
    log(colors.green, '✓ Security integration tests passed');
  } else {
    log(colors.red, `✗ Security integration tests failed: ${integrationTestResult.output}`);
  }
}

function generateReport(results) {
  log(colors.cyan, '\n=== Security Scan Summary ===');
  
  log(colors.green, '\nCompleted security scanning with the following results:');
  log(colors.green, '- Dependency vulnerability checks (using --legacy-peer-deps)');
  log(colors.green, '- Static code analysis');
  log(colors.green, '- Unit security tests');
  log(colors.green, '- Integration security tests');
  
  log(colors.yellow, '\n💡 Recommended next steps:');
  log(colors.yellow, '1. Address the specific vulnerabilities found in dependencies:');
  log(colors.yellow, '   - uuid package (bounds check issue)');
  log(colors.yellow, '   - protobufjs (DoS issue in functions)');
  log(colors.yellow, '   - qs package (DoS issue in functions)');
  log(colors.yellow, '2. Run `npm audit fix --legacy-peer-deps` to auto-fix fixable vulnerabilities');
  log(colors.yellow, '3. Run `npm run lint -- --fix --legacy-peer-deps` to auto-fix lint issues');
  log(colors.yellow, '4. Consider updating dependencies to their latest versions');
  
  log(colors.yellow, '\nFor additional DAST scanning, consider using OWASP ZAP:');
  log(colors.yellow, '1. Start your application: npx expo start --web');
  log(colors.yellow, '2. Run OWASP ZAP against your local instance');
  
  log(colors.yellow, '\nFor advanced SAST, consider adding:');
  log(colors.yellow, '- SonarQube: sonar-scanner');
  log(colors.yellow, '- Semgrep: npx semgrep scan');
  log(colors.yellow, '- NodeJSScan: npx nodejsscan -d .');
  
  log(colors.magenta, '\nRemember to re-run security scans after making changes to ensure issues are resolved!');
}

function main() {
  log(colors.magenta, '🚀 Starting CulturePass Security Scanning Suite');
  
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  runDependencyChecks();
  runSAST();
  runUnitSecurityTests();
  runIntegrationSecurityTests();
  generateReport();
  
  log(colors.magenta, '\n✅ Security scanning completed!');
  log(colors.yellow, 'Review the results above and address any identified issues.');
}

if (require.main === module) {
  main();
}

module.exports = {
  runCommand,
  checkPrerequisites,
  runDependencyChecks,
  runSAST,
  runUnitSecurityTests,
  runIntegrationSecurityTests,
  generateReport,
  main
};