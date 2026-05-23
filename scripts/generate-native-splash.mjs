/**
 * Builds native splash PNG for iOS / Android / Expo: same midnight gradient spine as
 * `generate-app-images.mjs` (Android adaptive background) + transparent logo composite
 * + taglines. Matches `app.json` splash.backgroundColor (#0B0B14) at the edges.
 *
 * Taglines stay aligned with `src/lib/app-meta.ts` (TAGLINE_PRIMARY / TAGLINE_SECONDARY).
 *
 * Requires: `sharp` from `server/node_modules` — run `cd server && npm install` once.
 *
 * Usage:
 *   From repo root: `npm run generate:splash`
 *   From `server/`:  `npm run generate:splash` (same script; cwd can be either)
 *   Direct:          `node scripts/generate-native-splash.mjs` (from repo root)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const sharpPath = path.join(root, "server/node_modules/sharp");
let sharp;
try {
  sharp = require(sharpPath);
} catch {
  console.error("Missing sharp. Run: cd server && npm install");
  process.exit(1);
}

/** iPhone 14 Pro Max logical canvas @3x reference (Expo / iOS splash convention). */
const W = 1284;
const H = 2778;

const logoPath = path.join(root, "assets/images/culturepass-logo.png");
const outPath = path.join(root, "assets/images/splash-icon.png");

/** Brand midnight — matches app.json splash.backgroundColor & THEME_COLOR_WEB */
const BG_DEEP = "#0B0B14";
const TEXT_MUTED = "#A8B0C4";

/** Sync with src/lib/app-meta.ts */
const TAGLINE_PRIMARY = "Belong anywhere.";
const TAGLINE_SECONDARY = "Discover. Connect. Belong.";

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Same gradient language as `scripts/generate-app-images.mjs` androidBackgroundSvg (portrait crop). */
function buildBackgroundSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgDiag" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12122A"/>
      <stop offset="50%" stop-color="${BG_DEEP}"/>
      <stop offset="100%" stop-color="#05050C"/>
    </linearGradient>
    <linearGradient id="bgVertical" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141428"/>
      <stop offset="38%" stop-color="${BG_DEEP}"/>
      <stop offset="100%" stop-color="#05050C"/>
    </linearGradient>
    <radialGradient id="glowCoral" cx="88%" cy="10%" r="58%" fx="88%" fy="10%">
      <stop offset="0%" stop-color="#FF5E5B" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="#FF5E5B" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#FF5E5B" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowIndigo" cx="12%" cy="82%" r="50%" fx="12%" fy="82%">
      <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.20"/>
      <stop offset="60%" stop-color="#4F46E5" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#4F46E5" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowTeal" cx="50%" cy="0%" r="72%" fx="50%" fy="0%">
      <stop offset="0%" stop-color="#0D9488" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0D9488" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="footerAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="50%" stop-color="#FF5E5B"/>
      <stop offset="100%" stop-color="#0D9488"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgVertical)"/>
  <rect width="${W}" height="${H}" fill="url(#bgDiag)" opacity="0.55"/>
  <rect width="${W}" height="${H}" fill="url(#glowTeal)"/>
  <rect width="${W}" height="${H}" fill="url(#glowCoral)"/>
  <rect width="${W}" height="${H}" fill="url(#glowIndigo)"/>
  <rect x="0" y="${H - 5}" width="${W}" height="5" fill="url(#footerAccent)" opacity="0.95"/>
</svg>`;
}

function buildTypographySvg() {
  const yPrimary = Math.round(H * 0.585);
  const ySecondary = Math.round(H * 0.585) + 58;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="primaryWordmark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8BB8F0"/>
      <stop offset="45%" stop-color="#EEF1F8"/>
      <stop offset="100%" stop-color="#B8F0E8"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <text x="${W / 2}" y="${yPrimary}" text-anchor="middle" filter="url(#softShadow)"
    fill="url(#primaryWordmark)" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="52" font-weight="700" letter-spacing="-0.02em">${escapeXml(TAGLINE_PRIMARY)}</text>
  <text x="${W / 2}" y="${ySecondary}" text-anchor="middle"
    fill="${TEXT_MUTED}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="30" font-weight="500" letter-spacing="0.12em">${escapeXml(TAGLINE_SECONDARY)}</text>
</svg>`;
}

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error("Missing", logoPath);
    process.exit(1);
  }

  const logoBuf = await sharp(logoPath)
    .ensureAlpha()
    .resize({ width: 680, fit: "inside" })
    .png()
    .toBuffer();

  const meta = await sharp(logoBuf).metadata();
  const lw = meta.width ?? 680;
  const lh = meta.height ?? 200;
  const lx = Math.round((W - lw) / 2);
  const ly = Math.round(H * 0.36 - lh / 2);

  const bgLayer = await sharp(Buffer.from(buildBackgroundSvg())).png().toBuffer();
  const typoLayer = await sharp(Buffer.from(buildTypographySvg())).png().toBuffer();

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 11, g: 11, b: 20, alpha: 1 },
    },
  })
    .composite([
      { input: bgLayer, left: 0, top: 0 },
      { input: typoLayer, left: 0, top: 0 },
      { input: logoBuf, left: lx, top: ly, blend: "over" },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log("Wrote", outPath, `${W}×${H}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
