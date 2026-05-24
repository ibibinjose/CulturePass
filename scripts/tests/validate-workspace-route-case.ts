import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve(process.cwd(), 'src/app');

async function run() {
  const entries = await fs.readdir(APP_DIR);

  // Check for a core route file that definitely exists in the project
  assert.equal(
    entries.includes('_layout.tsx'),
    true,
    'Expected core layout file at src/app/_layout.tsx.',
  );

  // Check that there are no case conflicts with core files
  assert.equal(
    entries.filter(entry => /^_layout\.(tsx|jsx)$/i.test(entry)).length <= 1,
    true,
    'Multiple case variations of _layout file found.',
  );

  console.log('core route casing is valid');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});