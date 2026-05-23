import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), process.env.WEB_DIST_DIR ?? 'dist');

const FORBIDDEN_PATTERNS: RegExp[] = [
  /(?:^|\/)_components\/.+\.html$/i,
  /(?:^|\/)_lib\/.+\.html$/i,
  /(?:^|\/)_styles\.html$/i,
  /(?:^|\/)_constants\.html$/i,
];

async function walkHtmlFiles(dir: string, root: string, out: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtmlFiles(abs, root, out);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    out.push(path.relative(root, abs).split(path.sep).join('/'));
  }
}

async function run() {
  const exists = await fs
    .access(DIST_DIR)
    .then(() => true)
    .catch(() => false);

  assert.equal(
    exists,
    true,
    `Web export directory not found at "${DIST_DIR}". Run "npm run build-web" first.`,
  );

  const htmlFiles: string[] = [];
  await walkHtmlFiles(DIST_DIR, DIST_DIR, htmlFiles);

  const leaked = htmlFiles.filter((rel) => FORBIDDEN_PATTERNS.some((pattern) => pattern.test(rel)));

  assert.equal(
    leaked.length,
    0,
    `Route hygiene failed. Helper routes leaked into dist:\n${leaked.map((p) => ` - ${p}`).join('\n')}`,
  );

  console.log(`web route hygiene checks passed (${htmlFiles.length} html files scanned)`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

