/**
 * Server-Side Validation Middleware
 *
 * Express middleware for validating and sanitizing incoming request data
 * for the HostSpace profile form system. Combines Zod schema validation
 * with sanitization and domain-specific validation rules.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md (Requirement 35)
 */

import { type NextFunction, type Request, type Response } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { sanitizationService } from '../services/sanitizationService';
import { fileValidationService } from '../services/fileValidationService';
import { logger } from 'firebase-functions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationMiddlewareOptions {
  /** Zod schema to validate the request body against. */
  schema?: ZodSchema;
  /** Fields that contain rich text HTML (will use HTML sanitization). */
  richTextFields?: string[];
  /** Whether to sanitize the request body in-place. Default: true. */
  sanitize?: boolean;
  /** Maximum allowed body size in characters. Default: 100000. */
  maxBodySize?: number;
  /** Custom validation functions to run after schema validation. */
  customValidators?: CustomValidator[];
}

type CustomValidator = (
  body: Record<string, unknown>,
  errors: ValidationError[]
) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Error Formatting
// ---------------------------------------------------------------------------

/**
 * Format Zod validation errors into a consistent API response format.
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

// ---------------------------------------------------------------------------
// Core Validation Middleware
// ---------------------------------------------------------------------------

/**
 * Creates an Express middleware that validates and sanitizes the request body.
 *
 * Validation pipeline:
 * 1. Check body size limit
 * 2. Sanitize all string fields (strip control chars, sanitize HTML for rich text)
 * 3. Validate against Zod schema (if provided)
 * 4. Run custom validators (coordinate ranges, currency amounts, etc.)
 * 5. Attach sanitized body to request
 *
 * Usage:
 *   router.post('/profiles/create',
 *     requireAuth,
 *     validateRequest({ schema: createProfileSchema, richTextFields: ['description'] }),
 *     handler
 *   );
 */
export function validateRequest(options: ValidationMiddlewareOptions = {}) {
  const {
    schema,
    richTextFields = [],
    sanitize = true,
    maxBodySize = 100000,
    customValidators = [],
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body;

      if (!body || typeof body !== 'object') {
        res.status(400).json({
          error: 'Request body is required',
          errors: [{ field: 'body', message: 'Request body must be a JSON object', code: 'invalid_type' }],
        });
        return;
      }

      // 1. Check body size
      const bodyString = JSON.stringify(body);
      if (bodyString.length > maxBodySize) {
        res.status(400).json({
          error: 'Request body exceeds maximum allowed size',
          errors: [{ field: 'body', message: `Request body exceeds ${maxBodySize} characters`, code: 'too_big' }],
        });
        return;
      }

      // 2. Sanitize the body
      if (sanitize) {
        const richTextFieldSet = new Set(richTextFields);
        req.body = sanitizationService.sanitizeObject(body, richTextFieldSet);
      }

      // 3. Validate against Zod schema
      if (schema) {
        const result = schema.safeParse(req.body);
        if (!result.success) {
          const errors = formatZodErrors(result.error);
          res.status(400).json({
            error: 'Validation failed',
            errors,
          });
          return;
        }
        // Replace body with parsed (and potentially transformed) data
        req.body = result.data;
      }

      // 4. Run custom validators
      if (customValidators.length > 0) {
        const errors: ValidationError[] = [];
        for (const validator of customValidators) {
          await validator(req.body, errors);
        }
        if (errors.length > 0) {
          res.status(400).json({
            error: 'Validation failed',
            errors,
          });
          return;
        }
      }

      next();
    } catch (error) {
      logger.error('[ValidationMiddleware] Unexpected error', error);
      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

// ---------------------------------------------------------------------------
// Specialized Validators (Custom Validator Functions)
// ---------------------------------------------------------------------------

/**
 * Validates that coordinate fields are within valid geographic ranges.
 * Latitude: -90 to 90, Longitude: -180 to 180.
 */
export function validateCoordinates(
  latField = 'latitude',
  lngField = 'longitude'
): CustomValidator {
  return (body, errors) => {
    const lat = getNestedValue(body, latField);
    const lng = getNestedValue(body, lngField);

    // Only validate if coordinates are present
    if (lat === undefined && lng === undefined) return;

    if (lat !== undefined) {
      const latNum = Number(lat);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.push({
          field: latField,
          message: 'Latitude must be between -90 and 90',
          code: 'invalid_range',
        });
      }
    }

    if (lng !== undefined) {
      const lngNum = Number(lng);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.push({
          field: lngField,
          message: 'Longitude must be between -180 and 180',
          code: 'invalid_range',
        });
      }
    }
  };
}

/**
 * Validates currency amount fields are positive with max 2 decimal places.
 */
export function validateCurrencyAmount(...fields: string[]): CustomValidator {
  return (body, errors) => {
    for (const field of fields) {
      const value = getNestedValue(body, field);
      if (value === undefined || value === null) continue;

      const num = Number(value);
      if (isNaN(num)) {
        errors.push({
          field,
          message: 'Currency amount must be a valid number',
          code: 'invalid_type',
        });
        continue;
      }

      if (num < 0) {
        errors.push({
          field,
          message: 'Currency amount must be a positive number',
          code: 'invalid_range',
        });
        continue;
      }

      // Check max 2 decimal places
      const decimalPart = num.toString().split('.')[1];
      if (decimalPart && decimalPart.length > 2) {
        errors.push({
          field,
          message: 'Currency amount must have at most 2 decimal places',
          code: 'invalid_precision',
        });
      }
    }
  };
}

/**
 * Validates handle format: lowercase alphanumeric and hyphens only,
 * 3-30 characters, no consecutive/leading/trailing hyphens.
 */
export function validateHandle(field = 'handle'): CustomValidator {
  return (body, errors) => {
    const value = getNestedValue(body, field);
    if (value === undefined || value === null) return;

    if (typeof value !== 'string') {
      errors.push({ field, message: 'Handle must be a string', code: 'invalid_type' });
      return;
    }

    if (value.length < 3) {
      errors.push({ field, message: 'Handle must be at least 3 characters', code: 'too_small' });
      return;
    }

    if (value.length > 30) {
      errors.push({ field, message: 'Handle must be at most 30 characters', code: 'too_big' });
      return;
    }

    if (!/^[a-z0-9-]+$/.test(value)) {
      errors.push({
        field,
        message: 'Handle must contain only lowercase letters, numbers, and hyphens',
        code: 'invalid_string',
      });
      return;
    }

    if (value.includes('--')) {
      errors.push({ field, message: 'Handle must not contain consecutive hyphens', code: 'invalid_string' });
      return;
    }

    if (value.startsWith('-') || value.endsWith('-')) {
      errors.push({ field, message: 'Handle must not start or end with a hyphen', code: 'invalid_string' });
    }
  };
}

/**
 * Validates ISO 8601 date format for specified fields.
 */
export function validateISODates(...fields: string[]): CustomValidator {
  return (body, errors) => {
    for (const field of fields) {
      const value = getNestedValue(body, field);
      if (value === undefined || value === null) continue;

      if (typeof value !== 'string') {
        errors.push({ field, message: 'Date must be a string in ISO 8601 format', code: 'invalid_type' });
        continue;
      }

      if (!sanitizationService.validateISODate(value)) {
        errors.push({ field, message: 'Date must be in valid ISO 8601 format (YYYY-MM-DD)', code: 'invalid_date' });
      }
    }
  };
}

/**
 * Validates text fields do not exceed maximum length.
 */
export function validateMaxLength(limits: Record<string, number>): CustomValidator {
  return (body, errors) => {
    for (const [field, maxLength] of Object.entries(limits)) {
      const value = getNestedValue(body, field);
      if (value === undefined || value === null) continue;

      if (typeof value !== 'string') continue;

      if (value.length > maxLength) {
        errors.push({
          field,
          message: `Field must not exceed ${maxLength} characters (currently ${value.length})`,
          code: 'too_big',
        });
      }
    }
  };
}

/**
 * Validates uploaded file metadata (used when file info is in the request body).
 */
export function validateFileMetadata(
  field: string,
  allowedCategories: ('image' | 'video' | 'document')[] = ['image', 'video', 'document']
): CustomValidator {
  return (body, errors) => {
    const fileData = getNestedValue(body, field) as Record<string, unknown> | undefined;
    if (!fileData) return;

    const { mimetype, size, originalname } = fileData as {
      mimetype?: string;
      size?: number;
      originalname?: string;
    };

    if (mimetype) {
      const mimeResult = fileValidationService.validateMimeType(mimetype, allowedCategories);
      if (!mimeResult.valid) {
        errors.push({ field: `${field}.mimetype`, message: mimeResult.error!, code: 'invalid_mime_type' });
      }
    }

    if (originalname) {
      const extResult = fileValidationService.validateExtension(originalname, mimetype);
      if (!extResult.valid) {
        errors.push({ field: `${field}.originalname`, message: extResult.error!, code: 'invalid_extension' });
      }
    }

    if (size !== undefined && mimetype) {
      const mimeResult = fileValidationService.validateMimeType(mimetype, allowedCategories);
      if (mimeResult.valid && mimeResult.category) {
        const sizeResult = fileValidationService.validateFileSize(
          size,
          mimeResult.category as 'image' | 'video' | 'document'
        );
        if (!sizeResult.valid) {
          errors.push({ field: `${field}.size`, message: sizeResult.error!, code: 'file_too_large' });
        }
      }
    }
  };
}

// ---------------------------------------------------------------------------
// File Upload Validation Middleware
// ---------------------------------------------------------------------------

/**
 * Middleware for validating multipart file uploads (used with multer).
 * Validates file type, size, and runs malware scanning.
 *
 * Usage:
 *   router.post('/upload',
 *     requireAuth,
 *     upload.single('file'),
 *     validateFileUpload({ allowedCategories: ['image'] }),
 *     handler
 *   );
 */
export function validateFileUpload(options: {
  allowedCategories?: ('image' | 'video' | 'document')[];
  uploadType?: string;
  scanForMalware?: boolean;
} = {}) {
  const {
    allowedCategories = ['image', 'video', 'document'],
    uploadType,
    scanForMalware = true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!file) {
      res.status(400).json({
        error: 'No file uploaded',
        errors: [{ field: 'file', message: 'A file is required', code: 'required' }],
      });
      return;
    }

    // Run comprehensive file validation
    const validationResult = fileValidationService.validateFile(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      { allowedCategories, uploadType }
    );

    if (!validationResult.valid) {
      res.status(400).json({
        error: 'File validation failed',
        errors: validationResult.errors.map((msg) => ({
          field: 'file',
          message: msg,
          code: 'invalid_file',
        })),
      });
      return;
    }

    // Run malware scan
    if (scanForMalware) {
      const scanResult = await fileValidationService.scanForMalware({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      });

      if (!scanResult.clean) {
        logger.warn('[FileUpload] Malware detected', {
          filename: file.originalname,
          threat: scanResult.threatName,
          userId: req.user?.id,
        });
        res.status(400).json({
          error: 'File rejected for security reasons',
          errors: [{ field: 'file', message: 'File failed security scan', code: 'malware_detected' }],
        });
        return;
      }
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// Pre-built Profile Validation Schemas
// ---------------------------------------------------------------------------

/** Common profile fields validation schema. */
export const profileBaseSchema = z.object({
  entityType: z.enum(['community', 'organiser', 'venue', 'business', 'artist', 'professional']),
  officialName: z.string().min(2).max(120),
  handle: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  tradingName: z.string().max(120).optional(),
  foundingDate: z.string().optional(),
  tagline: z.string().max(120).optional(),
  description: z.string().max(50000).optional(),
  publicEmail: z.string().email().optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  whatsappNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
}).passthrough();

/** Draft save validation schema (more permissive — partial data allowed). */
export const draftSaveSchema = z.object({
  formData: z.record(z.unknown()),
  currentStep: z.number().int().min(1).max(6),
  completedSteps: z.array(z.number().int().min(1).max(6)),
}).passthrough();

/** Handle validation schema. */
export const handleValidationSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, {
    message: 'Handle must contain only lowercase letters, numbers, and hyphens',
  }),
});

/** ABN validation schema. */
export const abnValidationSchema = z.object({
  abn: z.string().regex(/^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/, {
    message: 'ABN must be 11 digits (spaces optional)',
  }),
});

/** Profile publish schema (stricter — all required fields must be present). */
export const profilePublishSchema = z.object({
  formData: z.object({
    entityType: z.enum(['community', 'organiser', 'venue', 'business', 'artist', 'professional']),
    officialName: z.string().min(2).max(120),
    handle: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
    tagline: z.string().min(1).max(120),
    description: z.string().min(10).max(50000),
    publicEmail: z.string().email(),
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  }).passthrough(),
});

// ---------------------------------------------------------------------------
// Pre-configured Middleware Instances
// ---------------------------------------------------------------------------

/**
 * Validation middleware for profile creation.
 */
export const validateProfileCreate = validateRequest({
  schema: z.object({
    entityType: z.enum(['community', 'organiser', 'venue', 'business', 'artist', 'professional']),
    formData: z.record(z.unknown()),
  }),
  richTextFields: ['formData.description', 'formData.communityData.guidelines'],
  customValidators: [
    validateHandle('formData.handle'),
    validateCoordinates('formData.primaryAddress.latitude', 'formData.primaryAddress.longitude'),
    validateMaxLength({
      'formData.officialName': 120,
      'formData.tradingName': 120,
      'formData.tagline': 120,
      'formData.description': 50000,
    }),
  ],
});

/**
 * Validation middleware for draft saves.
 */
export const validateDraftSave = validateRequest({
  schema: draftSaveSchema,
  richTextFields: ['formData.description', 'formData.communityData.guidelines'],
  sanitize: true,
});

/**
 * Validation middleware for profile publishing.
 */
export const validateProfilePublish = validateRequest({
  schema: profilePublishSchema,
  richTextFields: ['formData.description', 'formData.communityData.guidelines'],
  customValidators: [
    validateHandle('formData.handle'),
    validateCoordinates('formData.primaryAddress.latitude', 'formData.primaryAddress.longitude'),
    validateCurrencyAmount(
      'formData.communityData.monthlyFee',
      'formData.professionalData.rateCard.0.rate',
      'formData.professionalData.rateCard.1.rate',
      'formData.professionalData.rateCard.2.rate'
    ),
    validateISODates('formData.foundingDate'),
    validateMaxLength({
      'formData.officialName': 120,
      'formData.tradingName': 120,
      'formData.tagline': 120,
      'formData.description': 50000,
    }),
  ],
});

/**
 * Validation middleware for handle uniqueness check.
 */
export const validateHandleCheck = validateRequest({
  schema: handleValidationSchema,
  customValidators: [validateHandle('handle')],
});

/**
 * Validation middleware for ABN validation.
 */
export const validateABNCheck = validateRequest({
  schema: abnValidationSchema,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get a nested value from an object using dot notation.
 * Supports array indexing with bracket notation (e.g., 'items.0.name').
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Handle array index notation
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = (current as Record<string, unknown>)[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}
