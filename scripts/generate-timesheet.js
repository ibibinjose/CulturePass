const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Execute git log with --name-only to list files
  const logOutput = execSync(
    'git log --pretty=format:"COMMIT:%H|%an|%ae|%aI|%s" --name-only',
    { encoding: 'utf-8' }
  );

  const commits = [];
  let currentCommit = null;

  const lines = logOutput.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('COMMIT:')) {
      if (currentCommit) {
        commits.push(currentCommit);
      }
      const parts = trimmed.substring(7).split('|');
      const hash = parts[0] || '';
      const author = parts[1] || '';
      const email = parts[2] || '';
      const date = parts[3] || '';
      const message = parts[4] || '';

      // Determine who/AI classification
      let executor = 'Human Developer';
      let systemLabel = 'ibibinjose';
      const msgLower = message.toLowerCase();
      const authorLower = author.toLowerCase();
      const emailLower = email.toLowerCase();

      if (
        authorLower.includes('cultureos') ||
        emailLower.includes('cultureos') ||
        msgLower.includes('antigravity') ||
        msgLower.includes('ai ') ||
        msgLower.includes('ai-') ||
        msgLower.includes('auto-deploy') ||
        msgLower.includes('linter') ||
        msgLower.includes('typecheck')
      ) {
        executor = 'AI Agent';
        systemLabel = 'Antigravity AI';
      }

      currentCommit = {
        hash: hash.substring(0, 7),
        fullHash: hash,
        author,
        email,
        date,
        message,
        executor,
        systemLabel,
        files: [],
      };
    } else if (currentCommit) {
      currentCommit.files.push(trimmed);
    }
  }

  if (currentCommit) {
    commits.push(currentCommit);
  }

  // Save to constants folder
  const targetDir = path.join(__dirname, '../src/constants');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(targetDir, 'timesheetData.json'),
    JSON.stringify(commits, null, 2),
    'utf-8'
  );

  console.log(`Successfully generated timesheet for ${commits.length} commits.`);
} catch (error) {
  console.error('Error generating timesheet data:', error);
  process.exit(1);
}
