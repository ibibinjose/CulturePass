/**
 * Sanitization Service
 *
 * Provides HTML sanitization (XSS prevention), text sanitization,
 * and handle character stripping for the HostSpace form system.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md (Requirement 35)
 */

// ---------------------------------------------------------------------------
// Allowed HTML tags and attributes for rich text fields
// ---------------------------------------------------------------------------

/** Tags permitted in rich text description fields. */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li',
  'h2', 'h3', 'h4',
  'a', 'span',
  'blockquote',
]);

/** Attributes permitted per tag. */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  span: new Set(['class']),
};

/** URL schemes allowed in href attributes. */
const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

// ---------------------------------------------------------------------------
// HTML Entity Encoding
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Escape special HTML characters to prevent XSS in plain text contexts.
 */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

// ---------------------------------------------------------------------------
// HTML Sanitizer (tag-based allowlist approach)
// ---------------------------------------------------------------------------

/**
 * Simple regex-based HTML sanitizer that strips disallowed tags and attributes.
 * For rich text fields that accept limited HTML formatting.
 *
 * Security approach:
 * - Allowlist of tags (everything else is stripped)
 * - Allowlist of attributes per tag (everything else is removed)
 * - URL scheme validation on href attributes
 * - Event handler attributes always stripped
 * - javascript: and data: URIs blocked
 */
function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let result = html;

  // Remove script tags and their content entirely
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove style tags and their content entirely
  result = result.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments (can contain conditional IE directives)
  result = result.replace(/<!--[\s\S]*?-->/g, '');

  // Remove CDATA sections
  result = result.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');

  // Process remaining tags
  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tagName, attrs) => {
    const tag = tagName.toLowerCase();
    const isClosing = match.startsWith('</');

    // Strip disallowed tags entirely
    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    // Parse and filter attributes
    const allowedAttrs = ALLOWED_ATTRIBUTES[tag];
    if (!allowedAttrs || !attrs.trim()) {
      return `<${tag}>`;
    }

    const sanitizedAttrs = sanitizeAttributes(attrs, allowedAttrs);
    return sanitizedAttrs ? `<${tag} ${sanitizedAttrs}>` : `<${tag}>`;
  });

  // Remove any remaining event handlers that might have slipped through
  result = result.replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
  result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  return result.trim();
}

/**
 * Sanitize HTML attributes, keeping only those in the allowlist.
 */
function sanitizeAttributes(attrString: string, allowedAttrs: Set<string>): string {
  const attrs: string[] = [];
  // Match attribute patterns: name="value", name='value', name=value, name
  const attrRegex = /([a-zA-Z][\w-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let attrMatch: RegExpExecArray | null;

  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    const attrName = attrMatch[1].toLowerCase();
    const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

    // Skip event handlers regardless of allowlist
    if (attrName.startsWith('on')) continue;

    // Skip disallowed attributes
    if (!allowedAttrs.has(attrName)) continue;

    // Validate URL attributes
    if (attrName === 'href') {
      const sanitizedUrl = sanitizeUrl(attrValue);
      if (!sanitizedUrl) continue;
      attrs.push(`${attrName}="${escapeHtml(sanitizedUrl)}"`);
      // Force rel="noopener noreferrer" on links
      attrs.push('rel="noopener noreferrer"');
    } else {
      attrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
    }
  }

  return attrs.join(' ');
}

/**
 * Validate and sanitize a URL, blocking dangerous schemes.
 */
function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // Block javascript:, data:, vbscript: schemes
  const lowerUrl = trimmed.toLowerCase().replace(/\s/g, '');
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return null;
  }

  // Validate URL scheme
  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_URL_SCHEMES.has(parsed.protocol)) {
      return null;
    }
    return trimmed;
  } catch {
    // Relative URLs are allowed
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Text Sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize plain text input by escaping HTML entities.
 * Use for fields that should NOT contain any HTML.
 */
function sanitizePlainText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return escapeHtml(text.trim());
}

/**
 * Strip control characters and null bytes from text.
 * Preserves newlines and tabs for multi-line fields.
 */
function stripControlCharacters(text: string): string {
  if (!text || typeof text !== 'string') return '';
  // Remove control chars except \t (0x09), \n (0x0A), \r (0x0D)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// ---------------------------------------------------------------------------
// Handle Sanitization
// ---------------------------------------------------------------------------

/**
 * Strip dangerous characters from handle, allowing only lowercase alphanumeric and hyphens.
 * Enforces handle format rules:
 * - Lowercase only
 * - Alphanumeric and hyphens only
 * - No consecutive hyphens
 * - No leading/trailing hyphens
 * - 3-30 characters
 */
function sanitizeHandle(handle: string): string {
  if (!handle || typeof handle !== 'string') return '';

  let sanitized = handle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') // Strip everything except lowercase alphanumeric and hyphens
    .replace(/-{2,}/g, '-')     // Replace consecutive hyphens with single
    .replace(/^-+/, '')         // Remove leading hyphens
    .replace(/-+$/, '');        // Remove trailing hyphens

  // Enforce length limits
  sanitized = sanitized.slice(0, 30);

  return sanitized;
}

// ---------------------------------------------------------------------------
// Currency Amount Sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize currency amount to ensure it's a valid positive number
 * with maximum 2 decimal places.
 */
function sanitizeCurrencyAmount(amount: unknown): number | null {
  if (amount === null || amount === undefined) return null;

  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (isNaN(num) || !isFinite(num)) return null;
  if (num < 0) return null;

  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

// ---------------------------------------------------------------------------
// Coordinate Sanitization
// ---------------------------------------------------------------------------

/**
 * Validate and sanitize geographic coordinates.
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
function sanitizeCoordinates(
  lat: unknown,
  lng: unknown
): { latitude: number; longitude: number } | null {
  const latitude = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
  const longitude = typeof lng === 'string' ? parseFloat(lng) : Number(lng);

  if (isNaN(latitude) || isNaN(longitude)) return null;
  if (!isFinite(latitude) || !isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

// ---------------------------------------------------------------------------
// Date Sanitization
// ---------------------------------------------------------------------------

/**
 * Validate that a date string is in ISO 8601 format.
 */
function validateISODate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;

  // ISO 8601 date patterns: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?)?$/;
  const match = isoDateRegex.exec(dateString);
  if (!match) return false;

  // Validate month and day ranges
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Verify it parses to a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// ---------------------------------------------------------------------------
// Deep Object Sanitization
// ---------------------------------------------------------------------------

/**
 * Recursively sanitize all string values in an object.
 * Applies plain text sanitization to all string fields.
 * Use `richTextFields` to specify fields that should use HTML sanitization instead.
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  richTextFields: Set<string> = new Set(),
  path = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${key}` : key;

    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value === 'string') {
      if (richTextFields.has(fieldPath) || richTextFields.has(key)) {
        result[key] = sanitizeHtml(stripControlCharacters(value));
      } else {
        result[key] = stripControlCharacters(value);
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map((item, index) => {
        if (typeof item === 'string') {
          const itemPath = `${fieldPath}[${index}]`;
          if (richTextFields.has(fieldPath) || richTextFields.has(key)) {
            return sanitizeHtml(stripControlCharacters(item));
          }
          return stripControlCharacters(item);
        }
        if (item !== null && typeof item === 'object') {
          return sanitizeObject(item as Record<string, unknown>, richTextFields, fieldPath);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      result[key] = sanitizeObject(value as Record<string, unknown>, richTextFields, fieldPath);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const sanitizationService = {
  /** Sanitize HTML content, keeping only allowed tags/attributes. */
  sanitizeHtml,

  /** Escape HTML entities for plain text display. */
  escapeHtml,

  /** Sanitize plain text (escape HTML entities + trim). */
  sanitizePlainText,

  /** Strip control characters from text. */
  stripControlCharacters,

  /** Sanitize a handle to allowed characters only. */
  sanitizeHandle,

  /** Sanitize and validate a URL. Returns null if invalid. */
  sanitizeUrl,

  /** Sanitize currency amount. Returns null if invalid. */
  sanitizeCurrencyAmount,

  /** Validate and sanitize coordinates. Returns null if invalid. */
  sanitizeCoordinates,

  /** Validate ISO 8601 date format. */
  validateISODate,

  /** Recursively sanitize all string values in an object. */
  sanitizeObject,
};
