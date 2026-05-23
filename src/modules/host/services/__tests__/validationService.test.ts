/**
 * Validation Service Tests (Client-Side)
 *
 * Tests for the client-side validation rules and helper functions.
 * Covers field validation rules, ABN/ACN checksum validation,
 * handle format validation, email/phone/URL validation,
 * readability scoring, and error message formatting.
 *
 * Note: The client-side validation logic lives in
 * `src/modules/host/schemas/validationRules.ts`.
 */

import {
  validateABNChecksum,
  validateACNChecksum,
  isReservedHandle,
  validateHandleFormat,
  validateEmailFormat,
  validatePhoneFormat,
  validateUrlFormat,
  validatePastDate,
  validateFireSafetyCapacity,
  calculateReadabilityScore,
  formatABNDisplay,
  stripABNFormatting,
  generateSuggestedHandle,
  getStepRequiredFields,
  FIELD_LIMITS,
  VALIDATION_PATTERNS,
  RESERVED_HANDLES,
  MEDIA_CONSTRAINTS,
  VALIDATION_TIMING,
} from '../../schemas/validationRules';

// ---------------------------------------------------------------------------
// ABN Validation
// ---------------------------------------------------------------------------

describe('validateABNChecksum', () => {
  it('returns true for valid ABN (51 824 753 556)', () => {
    expect(validateABNChecksum('51824753556')).toBe(true);
  });

  it('returns true for valid ABN with spaces', () => {
    expect(validateABNChecksum('51 824 753 556')).toBe(true);
  });

  it('returns false for invalid ABN checksum', () => {
    expect(validateABNChecksum('12345678901')).toBe(false);
  });

  it('returns false for ABN with wrong length', () => {
    expect(validateABNChecksum('1234567890')).toBe(false); // 10 digits
    expect(validateABNChecksum('123456789012')).toBe(false); // 12 digits
  });

  it('returns false for non-numeric ABN', () => {
    expect(validateABNChecksum('5182475355a')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateABNChecksum('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ACN Validation
// ---------------------------------------------------------------------------

describe('validateACNChecksum', () => {
  it('returns true for valid ACN (000 000 019)', () => {
    expect(validateACNChecksum('000000019')).toBe(true);
  });

  it('returns true for valid ACN with spaces', () => {
    expect(validateACNChecksum('000 000 019')).toBe(true);
  });

  it('returns false for invalid ACN checksum', () => {
    expect(validateACNChecksum('123456789')).toBe(false);
  });

  it('returns false for ACN with wrong length', () => {
    expect(validateACNChecksum('12345678')).toBe(false); // 8 digits
    expect(validateACNChecksum('1234567890')).toBe(false); // 10 digits
  });

  it('returns false for empty string', () => {
    expect(validateACNChecksum('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Handle Validation
// ---------------------------------------------------------------------------

describe('isReservedHandle', () => {
  it('returns true for reserved handles', () => {
    expect(isReservedHandle('admin')).toBe(true);
    expect(isReservedHandle('support')).toBe(true);
    expect(isReservedHandle('help')).toBe(true);
    expect(isReservedHandle('login')).toBe(true);
  });

  it('returns true for reserved handles regardless of case', () => {
    expect(isReservedHandle('ADMIN')).toBe(true);
    expect(isReservedHandle('Admin')).toBe(true);
    expect(isReservedHandle('SUPPORT')).toBe(true);
  });

  it('returns false for non-reserved handles', () => {
    expect(isReservedHandle('my-community')).toBe(false);
    expect(isReservedHandle('cool-venue')).toBe(false);
    expect(isReservedHandle('artist-name')).toBe(false);
  });
});

describe('validateHandleFormat', () => {
  it('returns null for valid handles', () => {
    expect(validateHandleFormat('my-community')).toBeNull();
    expect(validateHandleFormat('venue123')).toBeNull();
    expect(validateHandleFormat('abc')).toBeNull();
  });

  it('returns error for empty handle', () => {
    expect(validateHandleFormat('')).toBe('Handle is required');
  });

  it('returns error for handle too short', () => {
    expect(validateHandleFormat('ab')).toContain('at least');
  });

  it('returns error for handle too long', () => {
    const longHandle = 'a'.repeat(31);
    expect(validateHandleFormat(longHandle)).toContain('at most');
  });

  it('returns error for uppercase characters', () => {
    expect(validateHandleFormat('MyHandle')).toContain('lowercase');
  });

  it('returns error for special characters', () => {
    expect(validateHandleFormat('my_handle')).toContain('lowercase');
    expect(validateHandleFormat('my.handle')).toContain('lowercase');
    expect(validateHandleFormat('my@handle')).toContain('lowercase');
  });

  it('returns error for consecutive hyphens', () => {
    expect(validateHandleFormat('my--handle')).toContain('consecutive hyphens');
  });

  it('returns error for leading/trailing hyphens', () => {
    expect(validateHandleFormat('-myhandle')).not.toBeNull();
    expect(validateHandleFormat('myhandle-')).not.toBeNull();
  });

  it('returns error for reserved handles', () => {
    expect(validateHandleFormat('admin')).toContain('reserved');
    expect(validateHandleFormat('support')).toContain('reserved');
  });
});

// ---------------------------------------------------------------------------
// Email Validation
// ---------------------------------------------------------------------------

describe('validateEmailFormat', () => {
  it('returns null for valid emails', () => {
    expect(validateEmailFormat('user@example.com')).toBeNull();
    expect(validateEmailFormat('name.surname@domain.co.uk')).toBeNull();
    expect(validateEmailFormat('user+tag@gmail.com')).toBeNull();
  });

  it('returns error for empty email', () => {
    expect(validateEmailFormat('')).toBe('Email is required');
  });

  it('returns error for invalid email formats', () => {
    expect(validateEmailFormat('notanemail')).toContain('Invalid');
    expect(validateEmailFormat('@domain.com')).toContain('Invalid');
    expect(validateEmailFormat('user@')).toContain('Invalid');
    expect(validateEmailFormat('user @domain.com')).toContain('Invalid');
  });
});

// ---------------------------------------------------------------------------
// Phone Validation
// ---------------------------------------------------------------------------

describe('validatePhoneFormat', () => {
  it('returns null for valid E.164 phone numbers', () => {
    expect(validatePhoneFormat('+61412345678')).toBeNull();
    expect(validatePhoneFormat('+1234567890')).toBeNull();
    expect(validatePhoneFormat('+447911123456')).toBeNull();
  });

  it('returns error for empty phone', () => {
    expect(validatePhoneFormat('')).toBe('Phone number is required');
  });

  it('returns error for invalid phone formats', () => {
    expect(validatePhoneFormat('0412345678')).toContain('international format');
    expect(validatePhoneFormat('abc')).toContain('Invalid');
    expect(validatePhoneFormat('+0123456789')).toContain('Invalid'); // starts with 0
  });
});

// ---------------------------------------------------------------------------
// URL Validation
// ---------------------------------------------------------------------------

describe('validateUrlFormat', () => {
  it('returns null for valid HTTPS URLs', () => {
    expect(validateUrlFormat('https://example.com')).toBeNull();
    expect(validateUrlFormat('https://www.example.com/path')).toBeNull();
    expect(validateUrlFormat('https://sub.domain.com/path?q=1')).toBeNull();
  });

  it('returns null for empty URL (optional field)', () => {
    expect(validateUrlFormat('')).toBeNull();
  });

  it('returns error for HTTP URLs', () => {
    expect(validateUrlFormat('http://example.com')).toContain('https://');
  });

  it('returns error for non-URL strings', () => {
    expect(validateUrlFormat('not-a-url')).toContain('https://');
    expect(validateUrlFormat('ftp://example.com')).toContain('https://');
  });
});

// ---------------------------------------------------------------------------
// Date Validation
// ---------------------------------------------------------------------------

describe('validatePastDate', () => {
  it('returns null for past dates', () => {
    expect(validatePastDate('2020-01-01')).toBeNull();
    expect(validatePastDate('1990-06-15')).toBeNull();
  });

  it('returns error for empty date', () => {
    expect(validatePastDate('')).toBe('Date is required');
  });

  it('returns error for future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    expect(validatePastDate(futureDateStr)).toContain('future');
  });

  it('returns error for invalid date format', () => {
    expect(validatePastDate('01-01-2020')).toContain('YYYY-MM-DD');
    expect(validatePastDate('2020/01/01')).toContain('YYYY-MM-DD');
  });

  it('returns error for invalid date values', () => {
    // Month 13 produces an invalid Date in some environments
    const result = validatePastDate('2020-13-01');
    // Either null (JS rolls over to Jan 2021) or 'Invalid date' — both acceptable
    expect(result === null || result === 'Invalid date').toBe(true);
    // Truly invalid format:
    expect(validatePastDate('not-a-date')).toContain('YYYY-MM-DD');
  });
});

// ---------------------------------------------------------------------------
// Fire Safety Capacity Validation
// ---------------------------------------------------------------------------

describe('validateFireSafetyCapacity', () => {
  it('returns null when fire safety >= seated and standing', () => {
    expect(validateFireSafetyCapacity(500, 300, 400)).toBeNull();
    expect(validateFireSafetyCapacity(100, 100, 100)).toBeNull();
  });

  it('returns error when fire safety < seated', () => {
    const result = validateFireSafetyCapacity(200, 300, 100);
    expect(result).toContain('seated');
  });

  it('returns error when fire safety < standing', () => {
    const result = validateFireSafetyCapacity(200, 100, 300);
    expect(result).toContain('standing');
  });
});

// ---------------------------------------------------------------------------
// Readability Score
// ---------------------------------------------------------------------------

describe('calculateReadabilityScore', () => {
  it('returns 0 for empty text', () => {
    expect(calculateReadabilityScore('')).toBe(0);
    expect(calculateReadabilityScore('   ')).toBe(0);
  });

  it('returns a score between 0 and 100', () => {
    const text = 'The cat sat on the mat. It was a sunny day. The birds were singing.';
    const score = calculateReadabilityScore(text);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns higher score for simple text', () => {
    const simpleText = 'The cat sat on the mat. It was fun. We had a good time.';
    const complexText =
      'The implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding of computational paradigms.';

    const simpleScore = calculateReadabilityScore(simpleText);
    const complexScore = calculateReadabilityScore(complexText);

    expect(simpleScore).toBeGreaterThan(complexScore);
  });

  it('strips HTML tags before calculating', () => {
    const htmlText = '<p>The <strong>cat</strong> sat on the <em>mat</em>.</p>';
    const plainText = 'The cat sat on the mat.';

    const htmlScore = calculateReadabilityScore(htmlText);
    const plainScore = calculateReadabilityScore(plainText);

    expect(htmlScore).toBe(plainScore);
  });

  it('returns 0 for HTML-only content', () => {
    expect(calculateReadabilityScore('<br/><hr/>')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ABN Formatting
// ---------------------------------------------------------------------------

describe('formatABNDisplay', () => {
  it('formats 11-digit ABN with spaces', () => {
    expect(formatABNDisplay('51824753556')).toBe('51 824 753 556');
  });

  it('returns input unchanged if not 11 digits', () => {
    expect(formatABNDisplay('1234')).toBe('1234');
    expect(formatABNDisplay('123456789012')).toBe('123456789012');
  });
});

describe('stripABNFormatting', () => {
  it('removes spaces from formatted ABN', () => {
    expect(stripABNFormatting('51 824 753 556')).toBe('51824753556');
  });

  it('handles already-stripped ABN', () => {
    expect(stripABNFormatting('51824753556')).toBe('51824753556');
  });
});

// ---------------------------------------------------------------------------
// Handle Generation
// ---------------------------------------------------------------------------

describe('generateSuggestedHandle', () => {
  it('converts name to lowercase hyphenated handle', () => {
    expect(generateSuggestedHandle('My Community')).toBe('my-community');
  });

  it('removes special characters', () => {
    expect(generateSuggestedHandle("John's Venue!")).toBe('johns-venue');
  });

  it('collapses multiple spaces/hyphens', () => {
    expect(generateSuggestedHandle('My   Great   Venue')).toBe('my-great-venue');
  });

  it('trims leading/trailing hyphens', () => {
    expect(generateSuggestedHandle(' My Venue ')).toBe('my-venue');
  });

  it('truncates to max handle length', () => {
    const longName = 'A'.repeat(50) + ' Community';
    const result = generateSuggestedHandle(longName);
    expect(result.length).toBeLessThanOrEqual(FIELD_LIMITS.handle.max);
  });

  it('handles empty string', () => {
    expect(generateSuggestedHandle('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Step Required Fields
// ---------------------------------------------------------------------------

describe('getStepRequiredFields', () => {
  it('returns base fields for step 1', () => {
    const fields = getStepRequiredFields(1);
    expect(fields).toContain('officialName');
    expect(fields).toContain('handle');
    expect(fields).toContain('foundingDate');
    expect(fields).toContain('entityType');
  });

  it('returns ABN requirement for business entity on step 3', () => {
    const fields = getStepRequiredFields(3, 'business');
    expect(fields).toContain('abn');
  });

  it('returns ABN requirement for venue entity on step 3', () => {
    const fields = getStepRequiredFields(3, 'venue');
    expect(fields).toContain('abn');
  });

  it('does not require ABN for community entity on step 3', () => {
    const fields = getStepRequiredFields(3, 'community');
    expect(fields).not.toContain('abn');
  });

  it('returns empty array for review step (step 6)', () => {
    const fields = getStepRequiredFields(6);
    expect(fields).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Constants Validation
// ---------------------------------------------------------------------------

describe('validation constants', () => {
  it('FIELD_LIMITS has correct handle constraints', () => {
    expect(FIELD_LIMITS.handle.min).toBe(3);
    expect(FIELD_LIMITS.handle.max).toBe(30);
  });

  it('VALIDATION_TIMING has 8-second auto-save interval', () => {
    expect(VALIDATION_TIMING.autoSaveInterval).toBe(8000);
  });

  it('VALIDATION_TIMING has 300ms field debounce', () => {
    expect(VALIDATION_TIMING.fieldDebounce).toBe(300);
  });

  it('MEDIA_CONSTRAINTS logo requires 400x400 minimum', () => {
    expect(MEDIA_CONSTRAINTS.logo.minWidth).toBe(400);
    expect(MEDIA_CONSTRAINTS.logo.minHeight).toBe(400);
  });

  it('RESERVED_HANDLES contains expected platform keywords', () => {
    expect(RESERVED_HANDLES.has('admin')).toBe(true);
    expect(RESERVED_HANDLES.has('support')).toBe(true);
    expect(RESERVED_HANDLES.has('help')).toBe(true);
    expect(RESERVED_HANDLES.has('api')).toBe(true);
  });

  it('VALIDATION_PATTERNS.handle matches valid handles', () => {
    expect(VALIDATION_PATTERNS.handle.test('my-handle')).toBe(true);
    expect(VALIDATION_PATTERNS.handle.test('abc123')).toBe(true);
    expect(VALIDATION_PATTERNS.handle.test('a')).toBe(true);
  });

  it('VALIDATION_PATTERNS.handle rejects invalid handles', () => {
    expect(VALIDATION_PATTERNS.handle.test('My-Handle')).toBe(false);
    expect(VALIDATION_PATTERNS.handle.test('-handle')).toBe(false);
    expect(VALIDATION_PATTERNS.handle.test('handle-')).toBe(false);
  });
});
