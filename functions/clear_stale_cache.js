const fs = require('fs');
const path = require('path');
const http = require('http');

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

const rootDir = path.resolve(__dirname, '..');

// Obsolete compiled layouts from pre-rootDir migrations. Canonical output is
// functions/lib/functions/src/** (see functions/package.json "main").
const OBSOLETE_LIB_PREFIXES = [
  'functions/lib/src',
  'functions/lib/handlers',
  'functions/lib/services',
  'functions/lib/middleware',
  'functions/lib/jobs',
  'functions/lib/payments',
  'functions/lib/migrations',
  'functions/lib/shared',
  'functions/lib/triggers',
  'functions/lib/admin.js',
  'functions/lib/app.js',
  'functions/lib/index.js',
  'functions/lib/make-admin.js',
  'functions/lib/megaSeed.js',
  'functions/lib/triggers.js',
];

async function main() {
  console.log('Clearing stale cache entries for obsolete functions/lib layouts...');

  for (const relPath of OBSOLETE_LIB_PREFIXES) {
    const filePath = path.join(rootDir, relPath);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`Removed obsolete directory: ${relPath}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`Removed obsolete file: ${relPath}`);
      }

      await postJson('/scan', { filePath });
    } catch (err) {
      console.error(`Failed to clear ${relPath}: ${err.message}`);
    }
  }

  console.log('Stale cache clear completed!');
}

main().catch(console.error);