/**
 * File Validation Service
 *
 * Validates uploaded files for type, size, and integrates with malware scanning.
 * Supports image, video, and document uploads for the HostSpace form system.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md (Requirement 35)
 */

import { logger } from 'firebase-functions';

// ---------------------------------------------------------------------------
// File Type Definitions
// ---------------------------------------------------------------------------

/** Allowed MIME types grouped by category. */
const ALLOWED_MIME_TYPES: Record<string, Set<string>> = {
  image: new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]),
  video: new Set([
    'video/mp4',
    'video/webm',
  ]),
  document: new Set([
    'application/pdf',
  ]),
};

/** File extension to MIME type mapping for validation. */
const EXTENSION_MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

/** Magic bytes (file signatures) for type verification. */
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF)
  'video/mp4': [
    [0x00, 0x00, 0x00], // ftyp box (variable offset)
  ],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

// ---------------------------------------------------------------------------
// Size Limits
// ---------------------------------------------------------------------------

/** Maximum file sizes in bytes. */
const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,      // 10MB
  video: 100 * 1024 * 1024,     // 100MB
  document: 5 * 1024 * 1024,    // 5MB
};

/** Minimum image dimensions for specific upload types. */
const MIN_IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  logo: { width: 400, height: 400 },
  hero: { width: 1200, height: 675 },   // 16:9 minimum
  gallery: { width: 600, height: 400 },
};

// ---------------------------------------------------------------------------
// Validation Result Types
// ---------------------------------------------------------------------------

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: FileMetadata;
}

export interface FileMetadata {
  mimeType: string;
  size: number;
  category: 'image' | 'video' | 'document';
  extension: string;
}

export interface MalwareScanResult {
  clean: boolean;
  threatName?: string;
  scanTimestamp: string;
  scanProvider: string;
}

// ---------------------------------------------------------------------------
// File Validation Service
// ---------------------------------------------------------------------------

export const fileValidationService = {
  /**
   * Validate a file's MIME type against allowed types.
   */
  validateMimeType(
    mimeType: string,
    allowedCategories?: ('image' | 'video' | 'document')[]
  ): { valid: boolean; category?: string; error?: string } {
    if (!mimeType || typeof mimeType !== 'string') {
      return { valid: false, error: 'MIME type is required' };
    }

    const normalizedMime = mimeType.toLowerCase().trim();
    const categories = allowedCategories ?? ['image', 'video', 'document'];

    for (const category of categories) {
      const allowedTypes = ALLOWED_MIME_TYPES[category];
      if (allowedTypes?.has(normalizedMime)) {
        return { valid: true, category };
      }
    }

    return {
      valid: false,
      error: `File type '${normalizedMime}' is not allowed. Accepted types: ${categories
        .flatMap((cat) => [...(ALLOWED_MIME_TYPES[cat] ?? [])])
        .join(', ')}`,
    };
  },

  /**
   * Validate file extension matches expected MIME type.
   */
  validateExtension(
    filename: string,
    expectedMimeType?: string
  ): { valid: boolean; mimeType?: string; error?: string } {
    if (!filename || typeof filename !== 'string') {
      return { valid: false, error: 'Filename is required' };
    }

    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) {
      return { valid: false, error: 'File must have an extension' };
    }

    const extension = filename.slice(lastDot).toLowerCase();
    const mappedMime = EXTENSION_MIME_MAP[extension];

    if (!mappedMime) {
      return {
        valid: false,
        error: `File extension '${extension}' is not allowed. Accepted: ${Object.keys(EXTENSION_MIME_MAP).join(', ')}`,
      };
    }

    if (expectedMimeType && mappedMime !== expectedMimeType.toLowerCase()) {
      return {
        valid: false,
        error: `File extension '${extension}' does not match content type '${expectedMimeType}'`,
      };
    }

    return { valid: true, mimeType: mappedMime };
  },

  /**
   * Validate file size against category limits.
   */
  validateFileSize(
    size: number,
    category: 'image' | 'video' | 'document'
  ): { valid: boolean; error?: string } {
    if (typeof size !== 'number' || size <= 0) {
      return { valid: false, error: 'File size must be a positive number' };
    }

    const maxSize = MAX_FILE_SIZES[category];
    if (!maxSize) {
      return { valid: false, error: `Unknown file category: ${category}` };
    }

    if (size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      const actualMB = (size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${actualMB}MB) exceeds maximum allowed size (${maxMB}MB) for ${category} files`,
      };
    }

    return { valid: true };
  },

  /**
   * Verify file content matches claimed MIME type using magic bytes.
   * Returns true if the file signature matches, false if it doesn't,
   * or null if we can't determine (no magic bytes defined for this type).
   */
  verifyMagicBytes(
    buffer: Buffer,
    claimedMimeType: string
  ): { valid: boolean; error?: string } | null {
    const signatures = MAGIC_BYTES[claimedMimeType.toLowerCase()];
    if (!signatures) {
      // No magic bytes defined for this type — skip check
      return null;
    }

    if (buffer.length < 8) {
      return { valid: false, error: 'File is too small to verify content type' };
    }

    const matches = signatures.some((signature) =>
      signature.every((byte, index) => buffer[index] === byte)
    );

    if (!matches) {
      return {
        valid: false,
        error: `File content does not match claimed type '${claimedMimeType}'. Possible file type spoofing.`,
      };
    }

    return { valid: true };
  },

  /**
   * Comprehensive file validation combining type, size, and content checks.
   */
  validateFile(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer?: Buffer;
    },
    options?: {
      allowedCategories?: ('image' | 'video' | 'document')[];
      uploadType?: string; // 'logo', 'hero', 'gallery', etc.
    }
  ): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate MIME type
    const mimeResult = this.validateMimeType(file.mimetype, options?.allowedCategories);
    if (!mimeResult.valid) {
      errors.push(mimeResult.error!);
      return { valid: false, errors, warnings };
    }

    const category = mimeResult.category as 'image' | 'video' | 'document';

    // 2. Validate extension matches MIME type
    const extResult = this.validateExtension(file.originalname, file.mimetype);
    if (!extResult.valid) {
      errors.push(extResult.error!);
    }

    // 3. Validate file size
    const sizeResult = this.validateFileSize(file.size, category);
    if (!sizeResult.valid) {
      errors.push(sizeResult.error!);
    }

    // 4. Verify magic bytes if buffer is available
    if (file.buffer && file.buffer.length > 0) {
      const magicResult = this.verifyMagicBytes(file.buffer, file.mimetype);
      if (magicResult && !magicResult.valid) {
        errors.push(magicResult.error!);
      }
    } else {
      warnings.push('File content verification skipped (no buffer available)');
    }

    // 5. Check for suspicious filenames
    const suspiciousFilename = this.checkSuspiciousFilename(file.originalname);
    if (suspiciousFilename) {
      errors.push(suspiciousFilename);
    }

    const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: errors.length === 0
        ? {
            mimeType: file.mimetype,
            size: file.size,
            category,
            extension,
          }
        : undefined,
    };
  },

  /**
   * Check for suspicious filename patterns that may indicate an attack.
   */
  checkSuspiciousFilename(filename: string): string | null {
    if (!filename) return 'Filename is required';

    // Check for path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return 'Filename contains invalid path characters';
    }

    // Check for null bytes
    if (filename.includes('\x00')) {
      return 'Filename contains null bytes';
    }

    // Check for double extensions (e.g., file.jpg.exe)
    const parts = filename.split('.');
    if (parts.length > 2) {
      const dangerousExtensions = new Set(['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.php']);
      for (let i = 1; i < parts.length - 1; i++) {
        const ext = `.${parts[i].toLowerCase()}`;
        if (dangerousExtensions.has(ext)) {
          return 'Filename contains suspicious double extension';
        }
      }
    }

    // Check for excessively long filenames
    if (filename.length > 255) {
      return 'Filename exceeds maximum length (255 characters)';
    }

    return null;
  },

  /**
   * Initiate malware scan for an uploaded file.
   *
   * Integration point for antivirus service (e.g., Google Cloud DLP,
   * ClamAV, VirusTotal API). Returns scan result.
   *
   * In production, this would call an external scanning service.
   * Currently implements a basic heuristic check and logs for monitoring.
   */
  async scanForMalware(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer?: Buffer;
    }
  ): Promise<MalwareScanResult> {
    const scanTimestamp = new Date().toISOString();

    // Basic heuristic checks (supplement, not replace, a real AV scanner)
    if (file.buffer) {
      // Check for embedded scripts in image files
      if (file.mimetype.startsWith('image/')) {
        const content = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 4096));
        if (
          content.includes('<script') ||
          content.includes('javascript:') ||
          content.includes('<?php')
        ) {
          logger.warn('[MalwareScan] Embedded script detected in image file', {
            filename: file.originalname,
            mimetype: file.mimetype,
          });
          return {
            clean: false,
            threatName: 'Embedded.Script.InImage',
            scanTimestamp,
            scanProvider: 'internal-heuristic',
          };
        }
      }

      // Check for PE (Windows executable) headers in non-executable files
      if (file.buffer.length >= 2 && file.buffer[0] === 0x4D && file.buffer[1] === 0x5A) {
        if (!file.mimetype.includes('executable')) {
          logger.warn('[MalwareScan] PE header detected in non-executable file', {
            filename: file.originalname,
            mimetype: file.mimetype,
          });
          return {
            clean: false,
            threatName: 'Suspicious.PE.Header',
            scanTimestamp,
            scanProvider: 'internal-heuristic',
          };
        }
      }

      // Check for ELF (Linux executable) headers
      if (
        file.buffer.length >= 4 &&
        file.buffer[0] === 0x7F &&
        file.buffer[1] === 0x45 &&
        file.buffer[2] === 0x4C &&
        file.buffer[3] === 0x46
      ) {
        logger.warn('[MalwareScan] ELF header detected', {
          filename: file.originalname,
          mimetype: file.mimetype,
        });
        return {
          clean: false,
          threatName: 'Suspicious.ELF.Header',
          scanTimestamp,
          scanProvider: 'internal-heuristic',
        };
      }
    }

    // TODO: Integrate with external malware scanning service
    // Options:
    // 1. Google Cloud DLP API for sensitive data detection
    // 2. VirusTotal API for file hash checking
    // 3. ClamAV (self-hosted or cloud) for full AV scanning
    //
    // Example integration:
    // const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
    // if (vtApiKey && file.buffer) {
    //   const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    //   const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
    //     headers: { 'x-apikey': vtApiKey }
    //   });
    //   // Process response...
    // }

    logger.info('[MalwareScan] File passed heuristic checks', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    return {
      clean: true,
      scanTimestamp,
      scanProvider: 'internal-heuristic',
    };
  },

  /**
   * Validate image URL by checking HTTP response and content-type.
   */
  async validateImageUrl(url: string): Promise<{ valid: boolean; error?: string }> {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'Image URL is required' };
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'https:') {
        return { valid: false, error: 'Image URL must use HTTPS' };
      }

      // HEAD request to check content-type without downloading the full file
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeout);

        if (!response.ok) {
          return { valid: false, error: `Image URL returned HTTP ${response.status}` };
        }

        const contentType = response.headers.get('content-type') ?? '';
        const isImage = contentType.startsWith('image/');

        if (!isImage) {
          return { valid: false, error: `URL does not point to an image (content-type: ${contentType})` };
        }

        // Check if the image type is allowed
        const mimeResult = this.validateMimeType(contentType, ['image']);
        if (!mimeResult.valid) {
          return { valid: false, error: mimeResult.error };
        }

        return { valid: true };
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Image URL request timed out' };
      }
      return { valid: false, error: 'Failed to validate image URL' };
    }
  },

  /**
   * Get the maximum file size for a given category.
   */
  getMaxFileSize(category: 'image' | 'video' | 'document'): number {
    return MAX_FILE_SIZES[category] ?? 0;
  },

  /**
   * Get minimum image dimensions for a given upload type.
   */
  getMinDimensions(uploadType: string): { width: number; height: number } | null {
    return MIN_IMAGE_DIMENSIONS[uploadType] ?? null;
  },
};
