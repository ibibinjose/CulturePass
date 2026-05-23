/**
 * Validation Rules
 *
 * Centralized validation rules and constants for the HostSpace form system.
 * Provides field-level validation constraints, reserved keywords, and
 * validation helper functions used across form fields and schemas.
 *
 * Requirements: 4 (Real-Time Field Validation), 6 (Common Identity Fields),
 * 25 (Error Handling), 39 (Data Integrity)
 */

// ---------------------------------------------------------------------------
// Field Length Constraints
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Reserved Handles (canonical list in shared/constants/reservedHandles.ts)
// ---------------------------------------------------------------------------

import {
  RESERVED_HANDLES,
  RESERVED_HANDLES_LIST,
  isReservedHandle,
} from '@shared/constants/reservedHandles';

export const FIELD_LIMITS = {
  /** Official name: 2-120 characters */
  officialName: { min: 2, max: 120 },
  /** Trading name: 0-120 characters */
  tradingName: { min: 0, max: 120 },
  /** Handle: 3-30 characters */
  handle: { min: 3, max: 30 },
  /** Tagline: 1-120 characters */
  tagline: { min: 1, max: 120 },
  /** Description: 100-5000 characters */
  description: { min: 100, max: 5000 },
  /** Meta description: 0-160 characters */
  metaDescription: { min: 0, max: 160 },
  /** Community guidelines: 100-5000 characters */
  communityGuidelines: { min: 100, max: 5000 },
  /** Producer credentials: 0-1000 characters */
  producerCredentials: { min: 0, max: 1000 },
  /** Category tags: 3-10 items */
  categoryTags: { min: 3, max: 10 },
  /** Gallery images: 0-12 items */
  galleryImages: { min: 0, max: 12 },
  /** Portfolio items: 3-20 items */
  portfolioItems: { min: 3, max: 20 },
  /** Catalogue items: 0-20 items */
  catalogueItems: { min: 0, max: 20 },
  /** Social links: 0-8 items */
  socialLinks: { min: 0, max: 8 },
  /** Additional locations: 0-10 items */
  additionalLocations: { min: 0, max: 10 },
} as const;

// ---------------------------------------------------------------------------
// Validation Timing
// ---------------------------------------------------------------------------

export const VALIDATION_TIMING = {
  /** Debounce delay for real-time field validation (ms) */
  fieldDebounce: 300,
  /** Debounce delay for handle uniqueness check (ms) */
  handleDebounce: 300,
  /** Auto-save interval (ms) */
  autoSaveInterval: 8000,
  /** "Saved" indicator display duration (ms) */
  savedIndicatorDuration: 2000,
  /** Error indicator display duration (ms) */
  errorIndicatorDuration: 3000,
} as const;

export { RESERVED_HANDLES, RESERVED_HANDLES_LIST, isReservedHandle };

// ---------------------------------------------------------------------------
// Validation Patterns
// ---------------------------------------------------------------------------

export const VALIDATION_PATTERNS = {
  /** Handle: lowercase alphanumeric with hyphens, no consecutive/leading/trailing hyphens */
  handle: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
  /** Email: RFC 5322 simplified pattern */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Phone: E.164 international format */
  phone: /^\+?[1-9]\d{1,14}$/,
  /** URL: HTTPS required */
  url: /^https:\/\/.+/,
  /** ABN: 11 digits */
  abn: /^\d{11}$/,
  /** ACN: 9 digits */
  acn: /^\d{9}$/,
  /** Date: ISO 8601 date only */
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
  /** Time: HH:MM format */
  time: /^([01]\d|2[0-3]):([0-5]\d)$/,
  /** Image URL: common image extensions */
  imageUrl: /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i,
  /** Video URL: common video extensions */
  videoUrl: /\.(mp4|webm|mov)(\?.*)?$/i,
  /** Postcode: Australian format (4 digits) */
  postcodeAU: /^\d{4}$/,
  /** GST ID: Australian format */
  gstId: /^\d{11}$/,
} as const;

// ---------------------------------------------------------------------------
// Media Constraints
// ---------------------------------------------------------------------------

export const MEDIA_CONSTRAINTS = {
  logo: {
    minWidth: 400,
    minHeight: 400,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    aspectRatio: 1, // Square
    formats: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  hero: {
    minWidth: 1200,
    minHeight: 675,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    aspectRatios: [16 / 9, 21 / 9] as const,
    formats: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  gallery: {
    maxItems: 12,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB per image
    formats: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  video: {
    maxDurationSeconds: 180, // 3 minutes
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    formats: ['video/mp4', 'video/webm'] as const,
  },
  technicalRider: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    formats: ['application/pdf'] as const,
  },
  document: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    formats: ['application/pdf', 'image/jpeg', 'image/png'] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Validation Helper Functions
// ---------------------------------------------------------------------------

/**
 * Validate ABN checksum using the Australian government algorithm.
 * The algorithm:
 * 1. Subtract 1 from the first digit
 * 2. Multiply each digit by its weight
 * 3. Sum all products
 * 4. If sum % 89 === 0, the ABN is valid
 */
export function validateABNChecksum(abn: string): boolean {
  const cleaned = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) return false;

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map(Number);
  digits[0] -= 1; // Subtract 1 from first digit

  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  return sum % 89 === 0;
}

/**
 * Validate ACN checksum using the Australian government algorithm.
 */
export function validateACNChecksum(acn: string): boolean {
  const cleaned = acn.replace(/\s/g, '');
  if (!/^\d{9}$/.test(cleaned)) return false;

  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  const digits = cleaned.split('').map(Number);
  const sum = digits.slice(0, 8).reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const remainder = sum % 10;
  const checkDigit = (10 - remainder) % 10;

  return digits[8] === checkDigit;
}

/**
 * Validate handle format (without uniqueness check).
 * Returns null if valid, or an error message string.
 */
export function validateHandleFormat(handle: string): string | null {
  if (!handle) return 'Handle is required';
  if (handle.length < FIELD_LIMITS.handle.min) {
    return `Handle must be at least ${FIELD_LIMITS.handle.min} characters`;
  }
  if (handle.length > FIELD_LIMITS.handle.max) {
    return `Handle must be at most ${FIELD_LIMITS.handle.max} characters`;
  }
  if (!VALIDATION_PATTERNS.handle.test(handle)) {
    return 'Handle can only contain lowercase letters, numbers, and hyphens';
  }
  if (handle.includes('--')) {
    return 'Handle cannot contain consecutive hyphens';
  }
  if (isReservedHandle(handle)) {
    return 'This handle is reserved';
  }
  return null;
}

/**
 * Validate email format (RFC 5322 simplified).
 * Returns null if valid, or an error message string.
 */
export function validateEmailFormat(email: string): string | null {
  if (!email) return 'Email is required';
  if (!VALIDATION_PATTERNS.email.test(email)) {
    return 'Invalid email address';
  }
  return null;
}

/**
 * Validate phone number format (E.164).
 * Returns null if valid, or an error message string.
 */
export function validatePhoneFormat(phone: string): string | null {
  if (!phone) return 'Phone number is required';
  if (!VALIDATION_PATTERNS.phone.test(phone)) {
    return 'Invalid phone number. Use international format (e.g., +61412345678)';
  }
  return null;
}

/**
 * Validate URL format (HTTPS required).
 * Returns null if valid, or an error message string.
 */
export function validateUrlFormat(url: string): string | null {
  if (!url) return null; // URLs are often optional
  if (!VALIDATION_PATTERNS.url.test(url)) {
    return 'URL must start with https://';
  }
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL format';
  }
}

/**
 * Validate that a date is not in the future.
 * Returns null if valid, or an error message string.
 */
export function validatePastDate(dateStr: string): string | null {
  if (!dateStr) return 'Date is required';
  if (!VALIDATION_PATTERNS.isoDate.test(dateStr)) {
    return 'Date must be in YYYY-MM-DD format';
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  if (date > new Date()) {
    return 'Date cannot be in the future';
  }
  return null;
}

/**
 * Validate fire safety capacity against seated/standing.
 * Returns null if valid, or an error message string.
 */
export function validateFireSafetyCapacity(
  fireSafetyMax: number,
  seated: number,
  standing: number
): string | null {
  if (fireSafetyMax < seated) {
    return 'Fire safety capacity must be greater than or equal to seated capacity';
  }
  if (fireSafetyMax < standing) {
    return 'Fire safety capacity must be greater than or equal to standing capacity';
  }
  return null;
}

/**
 * Calculate Flesch-Kincaid readability score.
 * Score interpretation:
 * - 90-100: Very easy (5th grade)
 * - 80-89: Easy (6th grade)
 * - 70-79: Fairly easy (7th grade)
 * - 60-69: Standard (8th-9th grade)
 * - 50-59: Fairly difficult (10th-12th grade)
 * - 30-49: Difficult (college)
 * - 0-29: Very difficult (graduate)
 */
export function calculateReadabilityScore(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // Strip HTML tags for readability calculation
  const plainText = text.replace(/<[^>]*>/g, '').trim();
  if (!plainText) return 0;

  const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = plainText.split(/\s+/).filter((w) => w.length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);

  const score =
    206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in a word (English approximation).
 */
function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length <= 3) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevIsVowel = false;

  for (let i = 0; i < cleaned.length; i++) {
    const isVowel = vowels.includes(cleaned[i]);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }

  // Adjust for silent 'e' at end
  if (cleaned.endsWith('e') && count > 1) {
    count--;
  }

  // Adjust for common suffixes
  if (cleaned.endsWith('le') && cleaned.length > 2 && !vowels.includes(cleaned[cleaned.length - 3])) {
    count++;
  }

  return Math.max(1, count);
}

/**
 * Format ABN with spaces for display (XX XXX XXX XXX).
 */
export function formatABNDisplay(abn: string): string {
  const cleaned = abn.replace(/\s/g, '');
  if (cleaned.length !== 11) return abn;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
}

/**
 * Strip formatting from ABN for storage.
 */
export function stripABNFormatting(abn: string): string {
  return abn.replace(/\s/g, '');
}

/**
 * Generate a suggested handle from an official name.
 */
export function generateSuggestedHandle(officialName: string): string {
  return officialName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, FIELD_LIMITS.handle.max);
}

// ---------------------------------------------------------------------------
// Step Validation Requirements
// ---------------------------------------------------------------------------

/**
 * Required fields per wizard step (common across all entity types).
 * Entity-specific requirements are handled by the entity schemas.
 */
export const STEP_REQUIRED_FIELDS: Record<number, string[]> = {
  1: ['officialName', 'handle', 'foundingDate', 'entityType'],
  2: ['logoUrl', 'heroImageUrl'],
  3: ['publicEmail', 'phoneNumber'],
  4: ['primaryAddress'],
  5: ['tagline', 'description', 'categoryTags'],
  6: [], // Review step — validates complete form
};

/**
 * Get required fields for a step, including entity-specific requirements.
 */
export function getStepRequiredFields(step: number, entityType?: string): string[] {
  const baseFields = STEP_REQUIRED_FIELDS[step] ?? [];

  if (step === 3 && entityType) {
    switch (entityType) {
      case 'business':
      case 'venue':
        return [...baseFields, 'abn'];
      default:
        return baseFields;
    }
  }

  return baseFields;
}
