import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve(process.cwd(), 'app');

async function run() {
  const entries = await fs.readdir(APP_DIR);

  assert.equal(
    entries.includes('workspace.tsx'),
    true,
    'Expected canonical route file at app/workspace.tsx.',
  );

  assert.equal(
    entries.includes('Workspace.tsx'),
    false,
    'Unexpected case-colliding alias found at app/Workspace.tsx.',
  );

  console.log('workspace route casing is valid');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
