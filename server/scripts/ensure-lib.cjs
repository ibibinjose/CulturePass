const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const entry = path.join(root, 'lib', 'index.js');

if (!fs.existsSync(entry)) {
  execSync('npm run build', { stdio: 'inherit', cwd: root });
}
