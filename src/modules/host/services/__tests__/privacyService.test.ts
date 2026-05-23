/**
 * Privacy Service Tests
 *
 * Tests for the privacy and data protection service.
 * Covers field-level privacy controls, data export, consent management,
 * sensitive field handling, masking, and data deletion requests.
 */

import {
  isSensitiveField,
  maskSensitiveValue,
  createConsentRecord,
  validateRequiredConsents,
  getPrivacyPolicyUrl,
  SENSITIVE_FIELDS,
  DEFAULT_FIELD_PRIVACY,
  REQUIRED_CONSENTS,
  OPTIONAL_CONSENTS,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '../privacyService';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/api', () => ({
  api: {
    profiles: {
      get: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// ---------------------------------------------------------------------------
// Sensitive Field Detection
// ---------------------------------------------------------------------------

describe('isSensitiveField', () => {
  it('returns true for known sensitive fields', () => {
    expect(isSensitiveField('abn')).toBe(true);
    expect(isSensitiveField('acn')).toBe(true);
    expect(isSensitiveField('gstId')).toBe(true);
    expect(isSensitiveField('phoneNumber')).toBe(true);
    expect(isSensitiveField('whatsappNumber')).toBe(true);
    expect(isSensitiveField('publicEmail')).toBe(true);
    expect(isSensitiveField('taxId')).toBe(true);
    expect(isSensitiveField('insuranceCertificate')).toBe(true);
    expect(isSensitiveField('bankDetails')).toBe(true);
  });

  it('returns false for non-sensitive fields', () => {
    expect(isSensitiveField('officialName')).toBe(false);
    expect(isSensitiveField('handle')).toBe(false);
    expect(isSensitiveField('tagline')).toBe(false);
    expect(isSensitiveField('description')).toBe(false);
    expect(isSensitiveField('logoUrl')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Sensitive Value Masking
// ---------------------------------------------------------------------------

describe('maskSensitiveValue', () => {
  describe('ABN/ACN masking', () => {
    it('masks ABN showing last 3 digits', () => {
      const masked = maskSensitiveValue('abn', '51824753556');
      expect(masked).toContain('556');
      expect(masked).toContain('•');
      // Should not show the full number
      expect(masked).not.toBe('51824753556');
    });

    it('masks ACN showing last 3 digits', () => {
      const masked = maskSensitiveValue('acn', '000000019');
      expect(masked).toContain('019');
      expect(masked).toContain('•');
    });
  });

  describe('phone number masking', () => {
    it('masks phone showing last 4 digits', () => {
      const masked = maskSensitiveValue('phoneNumber', '+61412345678');
      expect(masked).toContain('5678');
      expect(masked).toContain('•');
      expect(masked).not.toContain('+61412');
    });

    it('masks WhatsApp number showing last 4 digits', () => {
      const masked = maskSensitiveValue('whatsappNumber', '+61498765432');
      expect(masked).toContain('5432');
      expect(masked).toContain('•');
    });

    it('returns short phone numbers unchanged', () => {
      const masked = maskSensitiveValue('phoneNumber', '1234');
      expect(masked).toBe('1234');
    });
  });

  describe('email masking', () => {
    it('masks email showing first char and domain', () => {
      const masked = maskSensitiveValue('publicEmail', 'john@example.com');
      expect(masked).toContain('j');
      expect(masked).toContain('@example.com');
      expect(masked).toContain('•');
      expect(masked).not.toContain('john');
    });

    it('handles email without @ symbol', () => {
      const masked = maskSensitiveValue('publicEmail', 'invalid');
      expect(masked).toBe('•••@•••');
    });
  });

  describe('tax ID masking', () => {
    it('masks GST ID showing last 4 characters', () => {
      const masked = maskSensitiveValue('gstId', '12345678901');
      expect(masked).toContain('8901');
      expect(masked).toContain('•');
    });

    it('returns short values unchanged', () => {
      const masked = maskSensitiveValue('taxId', '1234');
      expect(masked).toBe('1234');
    });
  });

  describe('generic masking', () => {
    it('masks unknown sensitive fields showing first and last char', () => {
      const masked = maskSensitiveValue('bankDetails', 'BSB123456');
      expect(masked[0]).toBe('B');
      expect(masked[masked.length - 1]).toBe('6');
      expect(masked).toContain('•');
    });

    it('returns •• for very short values', () => {
      const masked = maskSensitiveValue('bankDetails', 'AB');
      expect(masked).toBe('••');
    });
  });

  it('returns empty string for empty value', () => {
    expect(maskSensitiveValue('abn', '')).toBe('');
    expect(maskSensitiveValue('phoneNumber', '')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Consent Management
// ---------------------------------------------------------------------------

describe('createConsentRecord', () => {
  it('creates a consent record with correct fields', () => {
    const record = createConsentRecord('data-processing', 'data-processing', true, '1.0');

    expect(record.id).toBe('data-processing');
    expect(record.type).toBe('data-processing');
    expect(record.given).toBe(true);
    expect(record.policyVersion).toBe('1.0');
    expect(record.timestamp).toBeDefined();
    expect(record.context).toBe('web'); // Mocked Platform.OS
  });

  it('creates a consent withdrawal record', () => {
    const record = createConsentRecord('marketing', 'marketing', false);

    expect(record.given).toBe(false);
    expect(record.policyVersion).toBeUndefined();
  });

  it('includes timestamp in ISO format', () => {
    const record = createConsentRecord('analytics', 'analytics', true);
    expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('validateRequiredConsents', () => {
  it('returns valid when all required consents are given', () => {
    const consents: Record<string, boolean> = {
      'data-processing': true,
      'terms-of-service': true,
    };

    const result = validateRequiredConsents(consents);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('returns invalid when required consents are missing', () => {
    const consents: Record<string, boolean> = {
      'data-processing': true,
      // Missing terms-of-service
    };

    const result = validateRequiredConsents(consents);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('terms-of-service');
  });

  it('returns invalid when all required consents are missing', () => {
    const consents: Record<string, boolean> = {};

    const result = validateRequiredConsents(consents);
    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(REQUIRED_CONSENTS.length);
  });

  it('returns invalid when consent is explicitly false', () => {
    const consents: Record<string, boolean> = {
      'data-processing': false,
      'terms-of-service': true,
    };

    const result = validateRequiredConsents(consents);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('data-processing');
  });

  it('ignores optional consents', () => {
    const consents: Record<string, boolean> = {
      'data-processing': true,
      'terms-of-service': true,
      'marketing': false, // Optional — should not affect validity
    };

    const result = validateRequiredConsents(consents);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Privacy Policy URLs
// ---------------------------------------------------------------------------

describe('getPrivacyPolicyUrl', () => {
  it('returns AU-specific URL for AU region', () => {
    const url = getPrivacyPolicyUrl('au');
    expect(url).toContain('privacy-au');
  });

  it('returns EU-specific URL for EU region', () => {
    const url = getPrivacyPolicyUrl('eu');
    expect(url).toContain('privacy-eu');
  });

  it('returns default URL for unspecified region', () => {
    const url = getPrivacyPolicyUrl();
    expect(url).toBe(PRIVACY_POLICY_URL);
  });

  it('returns default URL for "default" region', () => {
    const url = getPrivacyPolicyUrl('default');
    expect(url).toBe(PRIVACY_POLICY_URL);
  });
});

// ---------------------------------------------------------------------------
// Default Privacy Settings
// ---------------------------------------------------------------------------

describe('DEFAULT_FIELD_PRIVACY', () => {
  it('sets public fields as public', () => {
    expect(DEFAULT_FIELD_PRIVACY.officialName).toBe('public');
    expect(DEFAULT_FIELD_PRIVACY.handle).toBe('public');
    expect(DEFAULT_FIELD_PRIVACY.tagline).toBe('public');
    expect(DEFAULT_FIELD_PRIVACY.description).toBe('public');
    expect(DEFAULT_FIELD_PRIVACY.logoUrl).toBe('public');
    expect(DEFAULT_FIELD_PRIVACY.heroImageUrl).toBe('public');
  });

  it('sets contact fields as members-only', () => {
    expect(DEFAULT_FIELD_PRIVACY.publicEmail).toBe('members-only');
    expect(DEFAULT_FIELD_PRIVACY.phoneNumber).toBe('members-only');
    expect(DEFAULT_FIELD_PRIVACY.whatsappNumber).toBe('members-only');
    expect(DEFAULT_FIELD_PRIVACY.primaryAddress).toBe('members-only');
  });

  it('sets sensitive fields as private', () => {
    expect(DEFAULT_FIELD_PRIVACY.abn).toBe('private');
    expect(DEFAULT_FIELD_PRIVACY.acn).toBe('private');
    expect(DEFAULT_FIELD_PRIVACY.gstId).toBe('private');
    expect(DEFAULT_FIELD_PRIVACY.gstRegistered).toBe('private');
    expect(DEFAULT_FIELD_PRIVACY.licences).toBe('private');
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('privacy constants', () => {
  it('SENSITIVE_FIELDS contains expected fields', () => {
    expect(SENSITIVE_FIELDS).toContain('abn');
    expect(SENSITIVE_FIELDS).toContain('acn');
    expect(SENSITIVE_FIELDS).toContain('phoneNumber');
    expect(SENSITIVE_FIELDS).toContain('publicEmail');
    expect(SENSITIVE_FIELDS).toContain('bankDetails');
  });

  it('REQUIRED_CONSENTS has data-processing and terms-of-service', () => {
    const ids = REQUIRED_CONSENTS.map((c) => c.id);
    expect(ids).toContain('data-processing');
    expect(ids).toContain('terms-of-service');
  });

  it('all REQUIRED_CONSENTS are marked as required', () => {
    for (const consent of REQUIRED_CONSENTS) {
      expect(consent.required).toBe(true);
    }
  });

  it('all OPTIONAL_CONSENTS are marked as not required', () => {
    for (const consent of OPTIONAL_CONSENTS) {
      expect(consent.required).toBe(false);
    }
  });

  it('OPTIONAL_CONSENTS includes marketing, analytics, and third-party', () => {
    const ids = OPTIONAL_CONSENTS.map((c) => c.id);
    expect(ids).toContain('marketing');
    expect(ids).toContain('analytics');
    expect(ids).toContain('third-party-sharing');
  });

  it('PRIVACY_POLICY_URL is a valid URL', () => {
    expect(PRIVACY_POLICY_URL).toMatch(/^https:\/\//);
  });

  it('TERMS_OF_SERVICE_URL is a valid URL', () => {
    expect(TERMS_OF_SERVICE_URL).toMatch(/^https:\/\//);
  });
});
