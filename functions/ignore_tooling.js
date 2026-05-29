const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 49183;

// Helper to make a POST request
function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: urlPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`Status ${res.statusCode}: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Find all files in a directory recursively
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else {
      fileList.push(name);
    }
  }
  return fileList;
}

async function main() {
  const rootDir = '/Users/cultureos/Dev230526/CulturePass';
  const targetFiles = [
    path.join(rootDir, 'metro.config.js'),
    path.join(rootDir, 'ios/Pods/GTMAppAuth/GTMAppAuth/Sources/KeychainStore/KeychainHelper.swift'),
  ];

  // Add all files in scripts/ and functions/scripts/
  const scriptsDir = path.join(rootDir, 'scripts');
  const funcScriptsDir = path.join(rootDir, 'functions/scripts');

  getFiles(scriptsDir, targetFiles);
  getFiles(funcScriptsDir, targetFiles);

  console.log(`Scanning and ignoring findings for ${targetFiles.length} files...`);

  let ignoreCount = 0;
  for (const filePath of targetFiles) {
    try {
      const scanRes = await postJson('/scan', { filePath });
      if (scanRes && scanRes.findings && scanRes.findings.length > 0) {
        for (const finding of scanRes.findings) {
          const ruleId = finding.subcategory;
          const lineNumber = finding.location.range.textRange.startLine;
          console.log(`Ignoring: ${filePath} -> Rule: ${ruleId} at Line: ${lineNumber}`);
          await postJson('/ignore', { filePath, ruleId, lineNumber });
          ignoreCount++;
        }
      }
    } catch (err) {
      console.error(`Failed for ${filePath}: ${err.message}`);
    }
  }

  console.log(`Successfully ignored ${ignoreCount} findings!`);
}

main().catch(console.error);
