const http = require('http');
const path = require('path');

const PORT = 49183;

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

async function main() {
  const rootDir = '/Users/cultureos/Dev230526/CulturePass';
  const filesToScan = [
    // Source TS files
    'functions/src/app.ts',
    'functions/src/middleware/requestId.ts',
    'functions/src/services/emailService.ts',
    'functions/src/services/walletPasses.ts',
    'functions/src/handlers/events.ts',

    // Compiled JS files
    'functions/lib/app.js',
    'functions/lib/src/app.js',
    'functions/lib/functions/src/app.js',
    
    'functions/lib/functions/src/middleware/requestId.js',
    
    'functions/lib/services/emailService.js',
    'functions/lib/src/services/emailService.js',
    'functions/lib/functions/src/services/emailService.js',
    
    'functions/lib/services/walletPasses.js',
    'functions/lib/src/services/walletPasses.js',
    'functions/lib/functions/src/services/walletPasses.js',

    'functions/lib/handlers/events.js',
    'functions/lib/src/handlers/events.js',
    'functions/lib/functions/src/handlers/events.js',
  ];

  console.log('Verifying remediation for modified files...');
  let totalFindings = 0;

  for (const relPath of filesToScan) {
    const filePath = path.join(rootDir, relPath);
    try {
      const scanRes = await postJson('/scan', { filePath });
      const findingsCount = scanRes.findings ? scanRes.findings.length : 0;
      console.log(`Scan: ${relPath} -> ${findingsCount} findings`);
      if (findingsCount > 0) {
        totalFindings += findingsCount;
        for (const finding of scanRes.findings) {
          console.log(`  [FINDING] Line ${finding.location.range.textRange.startLine}: ${finding.subcategory}`);
        }
      }
    } catch (err) {
      console.error(`Failed to scan ${relPath}: ${err.message}`);
    }
  }

  if (totalFindings === 0) {
    console.log('SUCCESS: All remediated files have 0 findings!');
    process.exit(0);
  } else {
    console.error(`FAILURE: Found ${totalFindings} remaining findings!`);
    process.exit(1);
  }
}

main().catch(console.error);
