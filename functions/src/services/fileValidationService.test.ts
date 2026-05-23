/**
 * Unit tests for the File Validation Service.
 */

import { fileValidationService } from './fileValidationService';

describe('fileValidationService', () => {
  describe('validateMimeType', () => {
    it('should accept valid image MIME types', () => {
      expect(fileValidationService.validateMimeType('image/jpeg', ['image'])).toEqual({
        valid: true,
        category: 'image',
      });
      expect(fileValidationService.validateMimeType('image/png', ['image'])).toEqual({
        valid: true,
        category: 'image',
      });
    });

    it('should accept valid video MIME types', () => {
      expect(fileValidationService.validateMimeType('video/mp4', ['video'])).toEqual({
        valid: true,
        category: 'video',
      });
    });

    it('should accept valid document MIME types', () => {
      expect(fileValidationService.validateMimeType('application/pdf', ['document'])).toEqual({
        valid: true,
        category: 'document',
      });
    });

    it('should reject disallowed MIME types', () => {
      const result = fileValidationService.validateMimeType('application/javascript', ['image']);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty MIME type', () => {
      expect(fileValidationService.validateMimeType('', ['image']).valid).toBe(false);
    });

    it('should check all categories when none specified', () => {
      expect(fileValidationService.validateMimeType('image/jpeg').valid).toBe(true);
      expect(fileValidationService.validateMimeType('video/mp4').valid).toBe(true);
      expect(fileValidationService.validateMimeType('application/pdf').valid).toBe(true);
    });
  });

  describe('validateExtension', () => {
    it('should accept valid image extensions', () => {
      expect(fileValidationService.validateExtension('photo.jpg')).toEqual({
        valid: true,
        mimeType: 'image/jpeg',
      });
      expect(fileValidationService.validateExtension('photo.png')).toEqual({
        valid: true,
        mimeType: 'image/png',
      });
    });

    it('should accept valid video extensions', () => {
      expect(fileValidationService.validateExtension('video.mp4')).toEqual({
        valid: true,
        mimeType: 'video/mp4',
      });
    });

    it('should reject disallowed extensions', () => {
      const result = fileValidationService.validateExtension('script.exe');
      expect(result.valid).toBe(false);
    });

    it('should reject files without extensions', () => {
      const result = fileValidationService.validateExtension('noextension');
      expect(result.valid).toBe(false);
    });

    it('should validate extension matches expected MIME type', () => {
      const result = fileValidationService.validateExtension('photo.jpg', 'image/png');
      expect(result.valid).toBe(false);
    });

    it('should be case-insensitive for extensions', () => {
      expect(fileValidationService.validateExtension('photo.JPG').valid).toBe(true);
      expect(fileValidationService.validateExtension('photo.PNG').valid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limits', () => {
      expect(fileValidationService.validateFileSize(5 * 1024 * 1024, 'image').valid).toBe(true);
      expect(fileValidationService.validateFileSize(50 * 1024 * 1024, 'video').valid).toBe(true);
      expect(fileValidationService.validateFileSize(3 * 1024 * 1024, 'document').valid).toBe(true);
    });

    it('should reject files exceeding image size limit (10MB)', () => {
      const result = fileValidationService.validateFileSize(11 * 1024 * 1024, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10');
    });

    it('should reject files exceeding video size limit (100MB)', () => {
      const result = fileValidationService.validateFileSize(101 * 1024 * 1024, 'video');
      expect(result.valid).toBe(false);
    });

    it('should reject files exceeding document size limit (5MB)', () => {
      const result = fileValidationService.validateFileSize(6 * 1024 * 1024, 'document');
      expect(result.valid).toBe(false);
    });

    it('should reject zero or negative sizes', () => {
      expect(fileValidationService.validateFileSize(0, 'image').valid).toBe(false);
      expect(fileValidationService.validateFileSize(-1, 'image').valid).toBe(false);
    });

    it('should accept files at exact size limit', () => {
      expect(fileValidationService.validateFileSize(10 * 1024 * 1024, 'image').valid).toBe(true);
    });
  });

  describe('verifyMagicBytes', () => {
    it('should verify JPEG magic bytes', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const result = fileValidationService.verifyMagicBytes(jpegBuffer, 'image/jpeg');
      expect(result?.valid).toBe(true);
    });

    it('should verify PNG magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = fileValidationService.verifyMagicBytes(pngBuffer, 'image/png');
      expect(result?.valid).toBe(true);
    });

    it('should verify PDF magic bytes', () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      const result = fileValidationService.verifyMagicBytes(pdfBuffer, 'application/pdf');
      expect(result?.valid).toBe(true);
    });

    it('should reject mismatched magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = fileValidationService.verifyMagicBytes(pngBuffer, 'image/jpeg');
      expect(result?.valid).toBe(false);
    });

    it('should reject buffers that are too small', () => {
      const tinyBuffer = Buffer.from([0xFF, 0xD8]);
      const result = fileValidationService.verifyMagicBytes(tinyBuffer, 'image/jpeg');
      expect(result?.valid).toBe(false);
    });

    it('should return null for unknown MIME types', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const result = fileValidationService.verifyMagicBytes(buffer, 'text/plain');
      expect(result).toBeNull();
    });
  });

  describe('checkSuspiciousFilename', () => {
    it('should accept normal filenames', () => {
      expect(fileValidationService.checkSuspiciousFilename('photo.jpg')).toBeNull();
      expect(fileValidationService.checkSuspiciousFilename('my-document.pdf')).toBeNull();
    });

    it('should reject path traversal attempts', () => {
      expect(fileValidationService.checkSuspiciousFilename('../etc/passwd')).not.toBeNull();
      expect(fileValidationService.checkSuspiciousFilename('..\\windows\\system32')).not.toBeNull();
    });

    it('should reject null bytes', () => {
      expect(fileValidationService.checkSuspiciousFilename('file.jpg\x00.exe')).not.toBeNull();
    });

    it('should reject excessively long filenames', () => {
      const longName = 'a'.repeat(256) + '.jpg';
      expect(fileValidationService.checkSuspiciousFilename(longName)).not.toBeNull();
    });

    it('should reject empty filenames', () => {
      expect(fileValidationService.checkSuspiciousFilename('')).not.toBeNull();
    });
  });

  describe('validateFile', () => {
    it('should validate a valid JPEG file', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, ...new Array(100).fill(0)]);
      const result = fileValidationService.validateFile({
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: jpegBuffer,
      });
      expect(result.valid).toBe(true);
      expect(result.metadata?.category).toBe('image');
    });

    it('should reject a file with wrong MIME type', () => {
      const result = fileValidationService.validateFile({
        originalname: 'script.exe',
        mimetype: 'application/x-executable',
        size: 1024,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject a file exceeding size limit', () => {
      const result = fileValidationService.validateFile({
        originalname: 'huge.jpg',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('size'))).toBe(true);
    });

    it('should restrict to allowed categories', () => {
      const result = fileValidationService.validateFile(
        {
          originalname: 'video.mp4',
          mimetype: 'video/mp4',
          size: 1024,
        },
        { allowedCategories: ['image'] }
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('scanForMalware', () => {
    it('should pass clean files', async () => {
      const cleanBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...new Array(100).fill(0)]);
      const result = await fileValidationService.scanForMalware({
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 104,
        buffer: cleanBuffer,
      });
      expect(result.clean).toBe(true);
      expect(result.scanProvider).toBe('internal-heuristic');
    });

    it('should detect embedded scripts in image files', async () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const buffer = Buffer.from(maliciousContent);
      const result = await fileValidationService.scanForMalware({
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        size: buffer.length,
        buffer,
      });
      expect(result.clean).toBe(false);
      expect(result.threatName).toBe('Embedded.Script.InImage');
    });

    it('should detect PE headers in non-executable files', async () => {
      const peBuffer = Buffer.from([0x4D, 0x5A, ...new Array(100).fill(0)]);
      const result = await fileValidationService.scanForMalware({
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: peBuffer.length,
        buffer: peBuffer,
      });
      expect(result.clean).toBe(false);
      expect(result.threatName).toBe('Suspicious.PE.Header');
    });

    it('should detect ELF headers', async () => {
      const elfBuffer = Buffer.from([0x7F, 0x45, 0x4C, 0x46, ...new Array(100).fill(0)]);
      const result = await fileValidationService.scanForMalware({
        originalname: 'file.pdf',
        mimetype: 'application/pdf',
        size: elfBuffer.length,
        buffer: elfBuffer,
      });
      expect(result.clean).toBe(false);
      expect(result.threatName).toBe('Suspicious.ELF.Header');
    });
  });

  describe('getMaxFileSize', () => {
    it('should return correct limits', () => {
      expect(fileValidationService.getMaxFileSize('image')).toBe(10 * 1024 * 1024);
      expect(fileValidationService.getMaxFileSize('video')).toBe(100 * 1024 * 1024);
      expect(fileValidationService.getMaxFileSize('document')).toBe(5 * 1024 * 1024);
    });
  });

  describe('getMinDimensions', () => {
    it('should return dimensions for known upload types', () => {
      expect(fileValidationService.getMinDimensions('logo')).toEqual({ width: 400, height: 400 });
      expect(fileValidationService.getMinDimensions('hero')).toEqual({ width: 1200, height: 675 });
    });

    it('should return null for unknown upload types', () => {
      expect(fileValidationService.getMinDimensions('unknown')).toBeNull();
    });
  });
});
