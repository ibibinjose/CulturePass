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

const rootDir = '/Users/cultureos/Dev230526/CulturePass';

// List of stale compiled files derived from findings
const staleFiles = [
  'functions/lib/admin.js',
  'functions/lib/app.js',
  'functions/lib/handlers/cultureToday.js',
  'functions/lib/handlers/events.js',
  'functions/lib/handlers/feed.js',
  'functions/lib/handlers/misc.js',
  'functions/lib/handlers/social.js',
  'functions/lib/handlers/utils.js',
  'functions/lib/index.js',
  'functions/lib/jobs/geohashBackfill.js',
  'functions/lib/make-admin.js',
  'functions/lib/megaSeed.js',
  'functions/lib/middleware/auth.js',
  'functions/lib/middleware/rateLimit.js',
  'functions/lib/middleware/validation.js',
  'functions/lib/migrations/v2DataMigration.js',
  'functions/lib/payments/stripeCheckout.js',
  'functions/lib/services/admin.js',
  'functions/lib/services/cultureExplorer.js',
  'functions/lib/services/emailService.js',
  'functions/lib/services/events.js',
  'functions/lib/services/fcmService.js',
  'functions/lib/services/fileValidationService.js',
  'functions/lib/services/firestore.js',
  'functions/lib/services/monitoringService.js',
  'functions/lib/services/profileService.js',
  'functions/lib/services/sanitizationService.js',
  'functions/lib/services/validationService.js',
  'functions/lib/services/verificationService.js',
  'functions/lib/services/walletPasses.js',
  'functions/lib/shared/schema.js',
  'functions/lib/src/admin.js',
  'functions/lib/src/app.js',
  'functions/lib/src/handlers/cultureToday.js',
  'functions/lib/src/handlers/events.js',
  'functions/lib/src/handlers/feed.js',
  'functions/lib/src/handlers/misc.js',
  'functions/lib/src/handlers/social.js',
  'functions/lib/src/handlers/utils.js',
  'functions/lib/src/index.js',
  'functions/lib/src/jobs/geohashBackfill.js',
  'functions/lib/src/make-admin.js',
  'functions/lib/src/megaSeed.js',
  'functions/lib/src/middleware/auth.js',
  'functions/lib/src/middleware/rateLimit.js',
  'functions/lib/src/middleware/validation.js',
  'functions/lib/src/migrations/v2DataMigration.js',
  'functions/lib/src/payments/stripeCheckout.js',
  'functions/lib/src/services/admin.js',
  'functions/lib/src/services/cultureExplorer.js',
  'functions/lib/src/services/emailService.js',
  'functions/lib/src/services/events.js',
  'functions/lib/src/services/fcmService.js',
  'functions/lib/src/services/fileValidationService.js',
  'functions/lib/src/services/firestore.js',
  'functions/lib/src/services/monitoringService.js',
  'functions/lib/src/services/profileService.js',
  'functions/lib/src/services/sanitizationService.js',
  'functions/lib/src/services/validationService.js',
  'functions/lib/src/services/verificationService.js',
  'functions/lib/src/services/walletPasses.js',
  'functions/lib/src/triggers/digest.js',
  'functions/lib/src/triggers/eventScores.js',
  'functions/lib/src/triggers/index.js',
  'functions/lib/src/triggers/onImageUpload.js',
  'functions/lib/src/triggers/reviews.js',
  'functions/lib/src/triggers/waitlist.js',
  'functions/lib/src/triggers.js'
];

async function main() {
  console.log(`Clearing cache for ${staleFiles.length} stale compiled files...`);
  
  for (const relPath of staleFiles) {
    const filePath = path.join(rootDir, relPath);
    
    // Skip if it actually exists in the workspace
    if (fs.existsSync(filePath)) {
      console.log(`Skipping existing file: ${relPath}`);
      continue;
    }
    
    try {
      // Create empty file
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '// cleared stale cache\n');
      
      // Trigger scan to update cache in daemon
      const scanRes = await postJson('/scan', { filePath });
      const count = scanRes.findings ? scanRes.findings.length : 0;
      console.log(`Cleared: ${relPath} -> scanned ${count} findings`);
      
      // Delete temporary file
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to clear ${relPath}: ${err.message}`);
    }
  }

  // Clean empty directories under functions/lib
  function cleanEmptyDirs(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const name = path.join(dir, file);
      if (fs.statSync(name).isDirectory()) {
        cleanEmptyDirs(name);
      }
    }
    // Re-check after cleaning children
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  }

  cleanEmptyDirs(path.join(rootDir, 'functions/lib/handlers'));
  cleanEmptyDirs(path.join(rootDir, 'functions/lib/services'));
  cleanEmptyDirs(path.join(rootDir, 'functions/lib/middleware'));
  cleanEmptyDirs(path.join(rootDir, 'functions/lib/jobs'));
  cleanEmptyDirs(path.join(rootDir, 'functions/lib/payments'));
  cleanEmptyDirs(path.join(rootDir, 'functions/lib/migrations'));
  cleanEmptyDirs(path.join(rootDir, 'functions/lib/shared'));
  cleanEmptyDirs(path.join(rootDir, 'functions/lib/src'));

  console.log('Stale cache clear completed!');
}

main().catch(console.error);
