import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';

/**
 * Resizes an image and generates a compact ThumbHash.
 * @param imageBuffer Raw image buffer
 * @returns Base64 encoded ThumbHash string
 */
export async function generateThumbHash(imageBuffer: Buffer): Promise<string> {
  // Step 1: Resize to small RGBA (ThumbHash works best at ~100x100 or smaller)
  const { data, info } = await sharp(imageBuffer)
    .resize({
      width: 100,
      height: 100,
      fit: 'inside',           // Preserve aspect ratio
      withoutEnlargement: true,
    })
    .ensureAlpha()             // Add alpha channel if missing
    .raw()                     // Get raw RGBA pixels
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  // Step 2: Generate ThumbHash (returns Uint8Array)
  const thumbHashBytes = rgbaToThumbHash(width, height, data);

  // Step 3: Convert to compact base64 string (tiny ~25-40 chars)
  const thumbHashBase64 = Buffer.from(thumbHashBytes).toString('base64');

  return thumbHashBase64;
}
