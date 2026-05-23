/**
 * Raster brand pack for Expo: iOS icon, Android adaptive layers, favicon, OG preview.
 * Uses Sharp (server/node_modules). Does not call external AI APIs — start from a master PNG.
 *
 * Default source: assets/images/culturepass-logo.png
 * Override: SOURCE_LOGO=/path/to.png node scripts/generate-app-images.mjs
 *
 * After updating the logo, run:
 *   npm run generate:brand-assets
 * (app icons + splash; see root package.json)
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

const BG = "#0B0B14";
const ICON = 1024;
const PAD = 0.13;

const sourcePath =
  process.env.SOURCE_LOGO ||
  path.join(root, "assets/images/culturepass-logo.png");

const out = {
  icon: path.join(root, "assets/images/icon.png"),
  androidFg: path.join(root, "assets/images/android-icon-foreground.png"),
  androidBg: path.join(root, "assets/images/android-icon-background.png"),
  androidMono: path.join(root, "assets/images/android-icon-monochrome.png"),
  favicon: path.join(root, "assets/images/favicon.png"),
  social: path.join(root, "assets/images/social-preview.png"),
};

/** Trim soft white margins; keep anti-aliased edges. */
async function loadLogoTrimmed() {
  if (!fs.existsSync(sourcePath)) {
    console.error("Missing source logo:", sourcePath);
    process.exit(1);
  }
  let pipeline = sharp(sourcePath).ensureAlpha();
  try {
    pipeline = pipeline.trim({ threshold: 18 });
  } catch {
    /* no-op */
  }
  return pipeline.png().toBuffer();
}

async function monochromeWhiteOnTransparent(logoBuf) {
  const { data, info } = await sharp(logoBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  if (ch !== 4) throw new Error("Expected RGBA");
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > 12) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = a;
    } else {
      out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
    }
  }
  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

function androidBackgroundSvg(size) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12122A"/>
      <stop offset="50%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#05050C"/>
    </linearGradient>
    <linearGradient id="v" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141428"/>
      <stop offset="40%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#05050C"/>
    </linearGradient>
    <radialGradient id="r" cx="88%" cy="10%" r="55%">
      <stop offset="0%" stop-color="#FF5E5B" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#FF5E5B" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#v)"/>
  <rect width="100%" height="100%" fill="url(#g)" opacity="0.55"/>
  <rect width="100%" height="100%" fill="url(#r)"/>
</svg>`);
}

function socialPreviewSvg(w, h) {
  const tag = "Belong anywhere.";
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141428"/>
      <stop offset="45%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#05050C"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="55%" stop-color="#FF5E5B"/>
      <stop offset="100%" stop-color="#0D9488"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="0" y="${h - 6}" width="${w}" height="6" fill="url(#accent)"/>
  <text x="${w / 2}" y="${Math.round(h * 0.78)}" text-anchor="middle"
    fill="#C8CED9" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="42" font-weight="600" letter-spacing="0.04em">${tag.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
</svg>`);
}

/** @returns {Promise<Buffer>} PNG bytes */
async function compositeCenteredSquare(logoBuf, size, background, padRatio = PAD) {
  const maxSide = Math.round(size * (1 - 2 * padRatio));
  const resized = await sharp(logoBuf)
    .resize({ width: maxSide, height: maxSide, fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const lw = meta.width ?? maxSide;
  const lh = meta.height ?? maxSide;
  const lx = Math.round((size - lw) / 2);
  const ly = Math.round((size - lh) / 2);

  const base =
    background === "transparent"
      ? sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
      : sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: background,
          },
        });

  return base
    .composite([{ input: resized, left: lx, top: ly, blend: "over" }])
    .png()
    .toBuffer();
}

async function main() {
  const logoBuf = await loadLogoTrimmed();
  console.log("Source:", sourcePath, "→ trimmed raster for compositing");

  const iconPng = await compositeCenteredSquare(logoBuf, ICON, BG);
  await fs.promises.writeFile(out.icon, iconPng);
  console.log("Wrote", out.icon);

  const fgPng = await compositeCenteredSquare(logoBuf, ICON, "transparent");
  await fs.promises.writeFile(out.androidFg, fgPng);
  console.log("Wrote", out.androidFg);

  await sharp(androidBackgroundSvg(ICON)).png().toFile(out.androidBg);
  console.log("Wrote", out.androidBg);

  const monoInner = await sharp(fgPng)
    .resize({ width: Math.round(ICON * 0.92), height: Math.round(ICON * 0.92), fit: "inside" })
    .png()
    .toBuffer();
  const mono = await monochromeWhiteOnTransparent(monoInner);
  await mono
    .resize(ICON, ICON, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out.androidMono);
  console.log("Wrote", out.androidMono);

  /** Tab / window icon: transparent PNG so light and dark browser chrome both look correct */
  const faviconPng = await compositeCenteredSquare(logoBuf, 96, "transparent", 0.1);
  await fs.promises.writeFile(out.favicon, faviconPng);
  console.log("Wrote", out.favicon, "(96×96 transparent)");

  const OW = 1200;
  const OH = 630;
  const bg = await sharp(socialPreviewSvg(OW, OH)).png().toBuffer();
  const smLogo = await sharp(logoBuf)
    .resize({
      width: Math.round(OW * 0.4),
      height: Math.round(OH * 0.5),
      fit: "inside",
    })
    .png()
    .toBuffer();
  const sm = await sharp(smLogo).metadata();
  const sw = sm.width ?? 400;
  const sh = sm.height ?? 200;
  await sharp(bg)
    .composite([{ input: smLogo, left: Math.round((OW - sw) / 2), top: Math.round(OH * 0.26 - sh / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(out.social);
  console.log("Wrote", out.social, `${OW}×${OH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
