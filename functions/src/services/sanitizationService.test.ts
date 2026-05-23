/**
 * Unit tests for the Sanitization Service.
 */

import { sanitizationService } from './sanitizationService';

describe('sanitizationService', () => {
  describe('sanitizeHtml', () => {
    it('should allow basic formatting tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<p>Hello <strong>world</strong></p>');
    });

    it('should strip script tags and their content', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<p>Hello</p><p>World</p>');
    });

    it('should strip style tags and their content', () => {
      const input = '<style>body{display:none}</style><p>Content</p>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<p>Content</p>');
    });

    it('should strip disallowed tags', () => {
      const input = '<p>Hello</p><div>World</div><img src="x">';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<p>Hello</p>World');
    });

    it('should strip event handler attributes', () => {
      const input = '<p onclick="alert(1)">Hello</p>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<p>Hello</p>');
    });

    it('should allow href on anchor tags with safe URLs', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizationService.sanitizeHtml(input);
      expect(result).toContain('href=');
      expect(result).toContain('example.com');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should block javascript: URLs in href', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizationService.sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should block data: URLs in href', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';
      const result = sanitizationService.sanitizeHtml(input);
      expect(result).not.toContain('data:');
    });

    it('should strip iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('');
    });

    it('should handle empty input', () => {
      expect(sanitizationService.sanitizeHtml('')).toBe('');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizationService.sanitizeHtml(null as unknown as string)).toBe('');
      expect(sanitizationService.sanitizeHtml(undefined as unknown as string)).toBe('');
    });

    it('should remove HTML comments', () => {
      const input = '<p>Hello</p><!-- comment --><p>World</p>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<p>Hello</p><p>World</p>');
    });

    it('should allow list elements', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    it('should allow heading elements h2-h4', () => {
      const input = '<h2>Title</h2><h3>Subtitle</h3>';
      expect(sanitizationService.sanitizeHtml(input)).toBe('<h2>Title</h2><h3>Subtitle</h3>');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizationService.escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(sanitizationService.escapeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(sanitizationService.escapeHtml("it's")).toBe("it&#x27;s");
      expect(sanitizationService.escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should handle empty string', () => {
      expect(sanitizationService.escapeHtml('')).toBe('');
    });
  });

  describe('sanitizePlainText', () => {
    it('should escape HTML and trim', () => {
      expect(sanitizationService.sanitizePlainText('  <b>hello</b>  ')).toBe('&lt;b&gt;hello&lt;&#x2F;b&gt;');
    });

    it('should handle empty/null input', () => {
      expect(sanitizationService.sanitizePlainText('')).toBe('');
      expect(sanitizationService.sanitizePlainText(null as unknown as string)).toBe('');
    });
  });

  describe('stripControlCharacters', () => {
    it('should remove null bytes and control characters', () => {
      expect(sanitizationService.stripControlCharacters('hello\x00world')).toBe('helloworld');
      expect(sanitizationService.stripControlCharacters('test\x01\x02\x03')).toBe('test');
    });

    it('should preserve newlines and tabs', () => {
      expect(sanitizationService.stripControlCharacters('hello\n\tworld')).toBe('hello\n\tworld');
    });

    it('should handle empty input', () => {
      expect(sanitizationService.stripControlCharacters('')).toBe('');
    });
  });

  describe('sanitizeHandle', () => {
    it('should convert to lowercase', () => {
      expect(sanitizationService.sanitizeHandle('MyHandle')).toBe('myhandle');
    });

    it('should strip special characters', () => {
      expect(sanitizationService.sanitizeHandle('my_handle!')).toBe('myhandle');
      expect(sanitizationService.sanitizeHandle('my@handle#123')).toBe('myhandle123');
    });

    it('should allow hyphens', () => {
      expect(sanitizationService.sanitizeHandle('my-handle')).toBe('my-handle');
    });

    it('should collapse consecutive hyphens', () => {
      expect(sanitizationService.sanitizeHandle('my--handle')).toBe('my-handle');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(sanitizationService.sanitizeHandle('-my-handle-')).toBe('my-handle');
    });

    it('should truncate to 30 characters', () => {
      const longHandle = 'a'.repeat(50);
      expect(sanitizationService.sanitizeHandle(longHandle).length).toBe(30);
    });

    it('should handle empty input', () => {
      expect(sanitizationService.sanitizeHandle('')).toBe('');
    });
  });

  describe('sanitizeCurrencyAmount', () => {
    it('should accept valid positive numbers', () => {
      expect(sanitizationService.sanitizeCurrencyAmount(10.50)).toBe(10.50);
      expect(sanitizationService.sanitizeCurrencyAmount(0)).toBe(0);
      expect(sanitizationService.sanitizeCurrencyAmount(100)).toBe(100);
    });

    it('should parse string numbers', () => {
      expect(sanitizationService.sanitizeCurrencyAmount('25.99')).toBe(25.99);
    });

    it('should round to 2 decimal places', () => {
      expect(sanitizationService.sanitizeCurrencyAmount(10.999)).toBe(11.00);
      expect(sanitizationService.sanitizeCurrencyAmount(10.555)).toBe(10.56);
    });

    it('should reject negative numbers', () => {
      expect(sanitizationService.sanitizeCurrencyAmount(-5)).toBeNull();
    });

    it('should reject NaN and Infinity', () => {
      expect(sanitizationService.sanitizeCurrencyAmount(NaN)).toBeNull();
      expect(sanitizationService.sanitizeCurrencyAmount(Infinity)).toBeNull();
      expect(sanitizationService.sanitizeCurrencyAmount('abc')).toBeNull();
    });

    it('should handle null/undefined', () => {
      expect(sanitizationService.sanitizeCurrencyAmount(null)).toBeNull();
      expect(sanitizationService.sanitizeCurrencyAmount(undefined)).toBeNull();
    });
  });

  describe('sanitizeCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(sanitizationService.sanitizeCoordinates(-33.8688, 151.2093)).toEqual({
        latitude: -33.8688,
        longitude: 151.2093,
      });
    });

    it('should accept boundary values', () => {
      expect(sanitizationService.sanitizeCoordinates(90, 180)).toEqual({ latitude: 90, longitude: 180 });
      expect(sanitizationService.sanitizeCoordinates(-90, -180)).toEqual({ latitude: -90, longitude: -180 });
    });

    it('should reject out-of-range latitude', () => {
      expect(sanitizationService.sanitizeCoordinates(91, 0)).toBeNull();
      expect(sanitizationService.sanitizeCoordinates(-91, 0)).toBeNull();
    });

    it('should reject out-of-range longitude', () => {
      expect(sanitizationService.sanitizeCoordinates(0, 181)).toBeNull();
      expect(sanitizationService.sanitizeCoordinates(0, -181)).toBeNull();
    });

    it('should reject NaN values', () => {
      expect(sanitizationService.sanitizeCoordinates(NaN, 0)).toBeNull();
      expect(sanitizationService.sanitizeCoordinates(0, NaN)).toBeNull();
    });

    it('should parse string coordinates', () => {
      expect(sanitizationService.sanitizeCoordinates('-33.8688', '151.2093')).toEqual({
        latitude: -33.8688,
        longitude: 151.2093,
      });
    });
  });

  describe('validateISODate', () => {
    it('should accept valid ISO 8601 dates', () => {
      expect(sanitizationService.validateISODate('2024-01-15')).toBe(true);
      expect(sanitizationService.validateISODate('2024-01-15T10:30:00Z')).toBe(true);
      expect(sanitizationService.validateISODate('2024-01-15T10:30:00.000Z')).toBe(true);
      expect(sanitizationService.validateISODate('2024-01-15T10:30:00+10:00')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(sanitizationService.validateISODate('15/01/2024')).toBe(false);
      expect(sanitizationService.validateISODate('Jan 15, 2024')).toBe(false);
      expect(sanitizationService.validateISODate('not-a-date')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(sanitizationService.validateISODate('2024-13-01')).toBe(false); // Month 13
      expect(sanitizationService.validateISODate('2024-00-15')).toBe(false); // Month 0
    });

    it('should reject empty/null input', () => {
      expect(sanitizationService.validateISODate('')).toBe(false);
      expect(sanitizationService.validateISODate(null as unknown as string)).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    it('should strip control characters from all string values', () => {
      const input = { name: 'hello\x00world', age: 25 };
      const result = sanitizationService.sanitizeObject(input);
      expect(result.name).toBe('helloworld');
      expect(result.age).toBe(25);
    });

    it('should apply HTML sanitization to rich text fields', () => {
      const input = { description: '<script>alert(1)</script><p>Hello</p>', title: 'Normal' };
      const result = sanitizationService.sanitizeObject(input, new Set(['description']));
      expect(result.description).toBe('<p>Hello</p>');
      expect(result.title).toBe('Normal');
    });

    it('should handle nested objects', () => {
      const input = { address: { street: 'Main\x00St', city: 'Sydney' } };
      const result = sanitizationService.sanitizeObject(input);
      expect((result.address as Record<string, unknown>).street).toBe('MainSt');
    });

    it('should handle arrays', () => {
      const input = { tags: ['hello\x00', 'world\x01'] };
      const result = sanitizationService.sanitizeObject(input);
      expect(result.tags).toEqual(['hello', 'world']);
    });

    it('should preserve null and undefined values', () => {
      const input = { name: null, age: undefined, active: true };
      const result = sanitizationService.sanitizeObject(input);
      expect(result.name).toBeNull();
      expect(result.age).toBeUndefined();
      expect(result.active).toBe(true);
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid https URLs', () => {
      expect(sanitizationService.sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should accept valid http URLs', () => {
      expect(sanitizationService.sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should accept mailto URLs', () => {
      expect(sanitizationService.sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizationService.sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should block data: URLs', () => {
      expect(sanitizationService.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should allow relative URLs', () => {
      expect(sanitizationService.sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(sanitizationService.sanitizeUrl('#section')).toBe('#section');
    });

    it('should handle empty input', () => {
      expect(sanitizationService.sanitizeUrl('')).toBeNull();
    });
  });
});
