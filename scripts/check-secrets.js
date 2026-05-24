#!/usr/bin/env node

/**
 * Secrets Scanner for CulturePass
 * Scans the codebase for potential secrets, API keys, and sensitive information
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate potential secrets
const SECRET_PATTERNS = [
  /\b(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/, // AWS Access Key
  /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{24,34}\b/, // Stripe Keys
  /password\s*[:=]\s*["'][^"']*["']/i,
  /secret\s*[:=]\s*["'][^"']*["']/i,
  /token\s*[:=]\s*["'][^"']*["']/i,
  /key\s*[:=]\s*["'][^"']*["']/i,
  /api[_-]?key\s*[:=]\s*["'][^"']*["']/i,
  /client[_-]?secret\s*[:=]\s*["'][^"']*["']/i,
  /authorization\s*[:=]\s*["']Bearer [^"']*["']/i,
  /Authorization:\s*Bearer\s*[^\s]+\b/i,
  /BEGIN (RSA |OPENSSH |DSA |EC )?PRIVATE KEY/,
];

// Directories to exclude from scanning
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'lib',
  'functions/lib',
  'ios',
  'android',
  '.expo',
  'coverage'
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json', '.yaml', '.yml', '.env', '.config.js', '.conf'];

function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.gz', '.exe', '.bin', '.ico'];
  return binaryExtensions.includes(ext);
}

function shouldScanFile(filePath) {
  const dir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  
  // Skip if directory is in exclude list
  if (EXCLUDE_DIRS.some(excludeDir => dir.includes(excludeDir))) {
    return false;
  }
  
  // Skip if file extension is not in scan list
  if (!SCAN_EXTENSIONS.includes(path.extname(filePath).toLowerCase())) {
    return false;
  }
  
  // Skip if it's a binary file
  if (isBinaryFile(filePath)) {
    return false;
  }
  
  // Skip if it's a lock file or build artifact
  if (fileName.endsWith('lock') || fileName.endsWith('.map') || fileName === 'package-lock.json') {
    return false;
  }
  
  return true;
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const findings = [];
    
    lines.forEach((line, index) => {
      SECRET_PATTERNS.forEach((pattern, patternIndex) => {
        if (pattern.test(line)) {
          findings.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            pattern: pattern.toString()
          });
        }
      });
    });
    
    return findings;
  } catch (error) {
    // Skip files that can't be read
    return [];
  }
}

function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let findings = [];
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(item)) {
        findings = findings.concat(scanDirectory(itemPath));
      }
    } else if (stat.isFile() && shouldScanFile(itemPath)) {
      findings = findings.concat(scanFile(itemPath));
    }
  });
  
  return findings;
}

function main() {
  console.log('🔍 Scanning for potential secrets in the codebase...\n');
  
  const startTime = Date.now();
  const findings = scanDirectory('.');
  const endTime = Date.now();
  
  if (findings.length > 0) {
    console.log(`⚠️  Found ${findings.length} potential secret(s):\n`);
    
    findings.forEach((finding, index) => {
      console.log(`[${index + 1}] ${finding.file}:${finding.line}`);
      console.log(`    Pattern: ${finding.pattern}`);
      console.log(`    Content: ${finding.content}\n`);
    });
    
    console.log('🚨 Review these findings immediately!');
    console.log('Remember: Never commit actual API keys, passwords, or other secrets to the repository.\n');
  } else {
    console.log('✅ No obvious secrets found in the codebase.');
  }
  
  console.log(`\n⏱️  Scan completed in ${(endTime - startTime) / 1000} seconds`);
}

if (require.main === module) {
  main();
}

module.exports = {
  scanFile,
  scanDirectory,
  shouldScanFile,
  isBinaryFile,
  SECRET_PATTERNS,
  main
};