/**
 * POST /api/uploads/image — multipart image upload (authenticated).
 * Stores under uploads/{uid}/… in the default bucket; returns public HTTPS URLs.
 */

import { randomBytes } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { requireAuth } from '../middleware/auth';
import { storageBucket } from '../admin';
import { captureRouteError } from './utils';

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const MAX_IMAGE_DIMENSION = 4096;
const MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION;

function publicGcsUrl(bucketName: string, objectPath: string): string {
  const encoded = objectPath.split('/').map(encodeURIComponent).join('/');
  return `https://storage.googleapis.com/${bucketName}/${encoded}`;
}

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/avif',
]);

uploadsRouter.post('/uploads/image', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  if (!storageBucket) {
    return res.status(503).json({ error: 'Storage is not configured for this environment' });
  }
  const file = req.file;
  if (!file?.buffer?.length) {
    return res.status(400).json({ error: 'Missing image file (field name: image)' });
  }
  const mime = (file.mimetype || '').toLowerCase();
  if (!ACCEPTED_MIME_TYPES.has(mime)) {
    return res.status(415).json({
      error: `Unsupported image format: ${file.mimetype || 'unknown'}. Accepted: JPEG, PNG, WebP, HEIC, AVIF.`,
    });
  }
  const uid = req.user!.id;
  const id = `${Date.now()}-${randomBytes(6).toString('hex')}`;
  const basePath = `uploads/${uid}/${id}`;

  try {
    const input = sharp(file.buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
      failOn: 'warning',
    });
    const inputMeta = await input.metadata();
    const width = inputMeta.width ?? 0;
    const height = inputMeta.height ?? 0;
    if (
      width <= 0 ||
      height <= 0 ||
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION ||
      width * height > MAX_IMAGE_PIXELS
    ) {
      return res.status(413).json({
        error: `Image dimensions must be no larger than ${MAX_IMAGE_DIMENSION}px per side and 16MP total.`,
      });
    }

    const pipeline = sharp(file.buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
      failOn: 'warning',
    }).rotate();
    const mainBuf = await pipeline
      .clone()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    const meta = await sharp(mainBuf).metadata();
    const thumbBuf = await sharp(mainBuf)
      .resize(480, 480, { fit: 'cover' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    const mainFile = storageBucket.file(`${basePath}.jpg`);
    const thumbFile = storageBucket.file(`${basePath}_thumb.jpg`);

    await mainFile.save(mainBuf, {
      contentType: 'image/jpeg',
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    await thumbFile.save(thumbBuf, {
      contentType: 'image/jpeg',
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    try {
      await mainFile.makePublic();
      await thumbFile.makePublic();
    } catch {
      // Uniform bucket-level access: object ACLs ignored — URLs still work if bucket is public or via token
    }

    const bucketName = storageBucket.name;
    const imageUrl = publicGcsUrl(bucketName, `${basePath}.jpg`);
    const thumbnailUrl = publicGcsUrl(bucketName, `${basePath}_thumb.jpg`);

    return res.status(201).json({
      imageUrl,
      thumbnailUrl,
      width: meta.width ?? undefined,
      height: meta.height ?? undefined,
    });
  } catch (err) {
    captureRouteError(err, 'POST /uploads/image');
    return res.status(500).json({ error: 'Failed to process or store image' });
  }
});
