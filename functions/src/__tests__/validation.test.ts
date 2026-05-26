/**
 * Integration tests for Validation API endpoints.
 *
 * Tests handle uniqueness validation and ABN validation endpoints.
 *
 * Validates: Requirements 34, 36
 */

import request from 'supertest';
import { app } from '../app';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Get references to mocked services
// ---------------------------------------------------------------------------

import { validationService } from '../services/profileService';

// ---------------------------------------------------------------------------
// Validation helpers for tests
// ---------------------------------------------------------------------------

const validateEvent = (data: any) => {
  return z.object({
    id: z.string(),
    title: z.string().min(1),
    description: z.string(),
    date: z.string().datetime(),
    locationId: z.string(),
    hostId: z.string(),
    councilId: z.string(),
    category: z.string(),
    maxAttendees: z.number().int().positive(),
    status: z.enum(['active', 'draft', 'archived', 'suspended']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).parse(data);
};

const validateProfile = (data: any) => {
  return z.object({
    id: z.string(),
    userId: z.string(),
    displayName: z.string().min(1),
    bio: z.string(),
    avatarUrl: z.string().url(),
    socialLinks: z.array(z.object({
      platform: z.string(),
      url: z.string().url(),
    })),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).parse(data);
};

const validateLocation = (data: any) => {
  return z.object({
    id: z.string(),
    name: z.string().min(1),
    address: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    city: z.string(),
    country: z.string(),
    postalCode: z.string(),
    capacity: z.number().int().positive(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).parse(data);
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('firebase-admin', () => {
  const firestoreMock = {
    collection: jest.fn(),
    settings: jest.fn(),
  };
  return {
    apps: [{ options: { projectId: 'test-project' } }],
    initializeApp: jest.fn(),
    firestore: jest.fn(() => firestoreMock),
    auth: jest.fn(() => ({
      verifyIdToken: jest.fn(),
    })),
    storage: jest.fn(() => ({
      bucket: jest.fn(() => null),
    })),
  };
});

jest.mock('../admin', () => ({
  db: {
    collection: jest.fn(),
    settings: jest.fn(),
  },
  authAdmin: {
    verifyIdToken: jest.fn(),
  },
  storageBucket: null,
  projectId: 'test-project',
  isFirestoreConfigured: true,
}));

jest.mock('../services/profileService', () => ({
  profileService: {
    getById: jest.fn(),
    getByHandle: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getVersionHistory: jest.fn(),
    rollbackToVersion: jest.fn(),
    getAnalytics: jest.fn(),
    trackView: jest.fn(),
    trackContactClick: jest.fn(),
  },
  draftService: {
    saveDraft: jest.fn(),
    getUserDrafts: jest.fn(),
    getDraft: jest.fn(),
    deleteDraft: jest.fn(),
  },
  validationService: {
    checkHandleExists: jest.fn(),
    validateABN: jest.fn(),
    validateABNFormat: jest.fn(),
  },
  verificationService: {
    requiresVerification: jest.fn(),
    createVerificationTask: jest.fn(),
    getChecklistForEntityType: jest.fn(),
  },
}));

jest.mock('../services/draftService', () => ({
  draftService: {
    saveDraft: jest.fn(),
    getUserDrafts: jest.fn(),
    getDraft: jest.fn(),
    deleteDraft: jest.fn(),
  },
}));

jest.mock('../services/validationService', () => ({
  validationService: {
    checkHandleExists: jest.fn(),
    validateABN: jest.fn(),
    validateABNFormat: jest.fn(),
  },
}));

jest.mock('../services/verificationService', () => ({
  verificationService: {
    requiresVerification: jest.fn(),
    createVerificationTask: jest.fn(),
    getChecklistForEntityType: jest.fn(),
  },
}));

jest.mock('../middleware/auth', () => {
  const original = jest.requireActual('../middleware/auth');
  return {
    ...original,
    authenticate: jest.fn((req: any, _res: any, next: any) => {
      if (req.headers.authorization === 'Bearer valid-token') {
        req.user = {
          id: 'test-user-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          issuedAt: Math.floor(Date.now() / 1000),
        };
      }
      next();
    }),
    requireAuth: jest.fn((req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      next();
    }),
    requireRole: jest.fn((..._roles: any[]) => (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      next();
    }),
    isOwnerOrAdmin: jest.fn((user: any, ownerId: string) => {
      if (user.role === 'admin' || user.role === 'platformAdmin' || user.role === 'moderator') return true;
      return user.id === ownerId;
    }),
  };
});

jest.mock('../middleware/moderation', () => ({
  moderationCheck: jest.fn((_req: any, _res: any, next: any) => next()),
}));

jest.mock('../middleware/rateLimit', () => ({
  slidingWindowRateLimit: jest.fn(() => (_req: any, _res: any, next: any) => next()),
  extractClientIp: jest.fn(() => '127.0.0.1'),
}));

jest.mock('firebase-functions', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../shared/schema/hostProfile', () => ({
  HostProfileSchema: {
    omit: jest.fn().mockReturnValue({
      parse: jest.fn((data: any) => data),
    }),
    partial: jest.fn().mockReturnValue({
      omit: jest.fn().mockReturnValue({
        parse: jest.fn((data: any) => data),
      }),
    }),
  },
  HostProfileFormDataSchema: {
    parse: jest.fn((data: any) => data),
  },
}));

jest.mock('../../../shared/schema/hostProfileDraft', () => ({
  ProfileDraftSchema: {
    parse: jest.fn((data: any) => data),
  },
  CreateProfileDraftSchema: {
    parse: jest.fn((data: any) => data),
  },
  UpdateProfileDraftSchema: {
    omit: jest.fn().mockReturnValue({
      parse: jest.fn((data: any) => data),
    }),
  },
}));

jest.mock('../../../shared/schema/hostProfileVersion', () => ({
  CreateProfileVersionSchema: {
    parse: jest.fn((data: any) => data),
  },
}));

const mockValidationService = validationService as any;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Validation API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/profiles/validate-handle ───────────────────────────────────

  describe('POST /api/profiles/validate-handle', () => {
    it('returns available for a unique handle', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'unique-handle' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
      expect(res.body.exists).toBe(false);
      expect(res.body.handle).toBe('unique-handle');
    });

    it('returns unavailable for a taken handle', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'taken-handle' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.exists).toBe(true);
    });

    it('rejects reserved words (via service)', async () => {
      // The service returns true for reserved handles
      mockValidationService.checkHandleExists.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
    });

    it('validates handle format - rejects invalid characters', async () => {
      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'INVALID_Handle!' });

      expect(res.status).toBe(400);
    });

    it('validates handle format - rejects too short', async () => {
      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'ab' });

      expect(res.status).toBe(400);
    });

    it('validates handle format - rejects too long', async () => {
      const longHandle = 'a'.repeat(31);
      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: longHandle });

      expect(res.status).toBe(400);
    });

    it('accepts valid handle format with hyphens', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'my-cool-handle' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it('supports excludeProfileId for update scenarios', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'existing-handle', excludeProfileId: 'profile-1' });

      expect(res.status).toBe(200);
      expect(mockValidationService.checkHandleExists).toHaveBeenCalledWith(
        'existing-handle',
        'profile-1'
      );
    });

    it('does not require authentication', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/profiles/validate-handle')
        .send({ handle: 'test-handle' });

      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/profiles/validate-abn ──────────────────────────────────────

  describe('POST /api/profiles/validate-abn', () => {
    it('validates a correct ABN and returns business details', async () => {
      mockValidationService.validateABN.mockResolvedValue({
        valid: true,
        businessName: 'Test Business CulturePass.App',
        status: 'Active',
        gstRegistered: true,
      });

      const res = await request(app)
        .post('/api/profiles/validate-abn')
        .set('Authorization', 'Bearer valid-token')
        .send({ abn: '51824753556' });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.businessName).toBe('Test Business CulturePass.App');
      expect(res.body.status).toBe('Active');
      expect(res.body.gstRegistered).toBe(true);
    });

    it('rejects invalid ABN format (non-numeric)', async () => {
      const res = await request(app)
        .post('/api/profiles/validate-abn')
        .set('Authorization', 'Bearer valid-token')
        .send({ abn: 'not-a-number' });

      expect(res.status).toBe(400);
    });

    it('rejects ABN with wrong length', async () => {
      const res = await request(app)
        .post('/api/profiles/validate-abn')
        .set('Authorization', 'Bearer valid-token')
        .send({ abn: '1234567' });

      expect(res.status).toBe(400);
    });

    it('handles invalid ABN checksum from service', async () => {
      mockValidationService.validateABN.mockResolvedValue({
        valid: false,
        error: 'Invalid ABN checksum',
      });

      const res = await request(app)
        .post('/api/profiles/validate-abn')
        .set('Authorization', 'Bearer valid-token')
        .send({ abn: '12345678901' });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('checksum');
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/profiles/validate-abn')
        .send({ abn: '51824753556' });

      expect(res.status).toBe(401);
    });

    it('handles service errors gracefully', async () => {
      mockValidationService.validateABN.mockRejectedValue(new Error('Service unavailable'));

      const res = await request(app)
        .post('/api/profiles/validate-abn')
        .set('Authorization', 'Bearer valid-token')
        .send({ abn: '51824753556' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to validate ABN');
    });
  });
});

describe('Validation Utility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a valid event', () => {
    const validEvent = {
      id: 'event-123',
      title: 'Cultural Festival',
      description: 'A celebration of cultural diversity',
      date: new Date().toISOString(),
      locationId: 'location-123',
      hostId: 'host-123',
      councilId: 'council-123',
      category: 'festival',
      maxAttendees: 100,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => validateEvent(validEvent)).not.toThrow();
  });

  it('should throw error for invalid event', () => {
    const invalidEvent = {
      title: 123, // Invalid type
      date: 'invalid-date', // Invalid format
    };

    expect(() => validateEvent(invalidEvent)).toThrow(z.ZodError);
  });

  it('should validate a valid profile', () => {
    const validProfile = {
      id: 'profile-123',
      userId: 'user-123',
      displayName: 'John Doe',
      bio: 'Software Developer',
      avatarUrl: 'https://example.com/avatar.jpg',
      socialLinks: [{ platform: 'twitter', url: 'https://twitter.com/johndoe' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => validateProfile(validProfile)).not.toThrow();
  });

  it('should throw error for invalid profile', () => {
    const invalidProfile = {
      displayName: 123, // Invalid type
      socialLinks: [{ platform: 'invalid', url: 'not-a-url' }], // Invalid values
    };

    expect(() => validateProfile(invalidProfile)).toThrow(z.ZodError);
  });

  it('should validate a valid location', () => {
    const validLocation = {
      id: 'location-123',
      name: 'Central Park',
      address: 'New York, NY',
      latitude: 40.785091,
      longitude: -73.968285,
      city: 'New York',
      country: 'USA',
      postalCode: '10024',
      capacity: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => validateLocation(validLocation)).not.toThrow();
  });

  it('should throw error for invalid location', () => {
    const invalidLocation = {
      name: '', // Empty string
      latitude: 'not-a-number', // Invalid type
      longitude: 200, // Out of range
    };

    expect(() => validateLocation(invalidLocation)).toThrow(z.ZodError);
  });
});
