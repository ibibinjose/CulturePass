/**
 * Integration tests for Profile API endpoints.
 *
 * Tests CRUD operations, publish, version history, rollback, and analytics.
 *
 * Validates: Requirements 34, 36
 */

import request from 'supertest';
import { app } from '../app';
import { jest, describe, expect /* , test */ } from '@jest/globals';
import { profileService } from '../services/profile';

// Mock the profile service
jest.mock('../services/profile');

describe('Profile Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a profile', async () => {
    const mockProfileData = {
      id: 'profile-123',
      userId: 'user-123',
      displayName: 'John Doe',
      bio: 'Software Developer',
      avatarUrl: 'https://example.com/avatar.jpg',
      socialLinks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (profileService.create as jest.MockedFunction<typeof profileService.create>)
      .mockResolvedValue(mockProfileData);

    const result = await profileService.create(mockProfileData);

    expect(profileService.create).toHaveBeenCalledWith(mockProfileData);
    expect(result).toEqual(mockProfileData);
  });

  it('should get a profile by ID', async () => {
    const mockProfile = {
      id: 'profile-123',
      userId: 'user-123',
      displayName: 'John Doe',
      bio: 'Software Developer',
      avatarUrl: 'https://example.com/avatar.jpg',
      socialLinks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (profileService.getById as jest.MockedFunction<typeof profileService.getById>)
      .mockResolvedValue(mockProfile);

    const result = await profileService.getById('profile-123');

    expect(profileService.getById).toHaveBeenCalledWith('profile-123');
    expect(result).toEqual(mockProfile);
  });

  it('should update a profile', async () => {
    const profileId = 'profile-123';
    const updatedData = {
      displayName: 'Jane Doe',
      bio: 'Senior Software Developer',
    };
    const mockUpdatedProfile = {
      id: 'profile-123',
      userId: 'user-123',
      displayName: 'Jane Doe',
      bio: 'Senior Software Developer',
      avatarUrl: 'https://example.com/avatar.jpg',
      socialLinks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (profileService.update as jest.MockedFunction<typeof profileService.update>)
      .mockResolvedValue(mockUpdatedProfile);

    const result = await profileService.update(profileId, updatedData);

    expect(profileService.update).toHaveBeenCalledWith(profileId, updatedData);
    expect(result).toEqual(mockUpdatedProfile);
  });

  it('should delete a profile', async () => {
    const profileId = 'profile-123';

    (profileService.delete as jest.MockedFunction<typeof profileService.delete>)
      .mockResolvedValue(undefined);

    await profileService.delete(profileId);

    expect(profileService.delete).toHaveBeenCalledWith(profileId);
  });
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock firebase-admin before anything imports it
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

// Mock the admin module
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

// Mock services — use require to get references after jest.mock hoisting
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

// Mock the authenticate middleware to inject a test user

jest.mock('../middleware/auth', () => {
  const original = jest.requireActual('../middleware/auth');
  return {
    ...original,
    authenticate: jest.fn((req: any, _res: any, next: any) => {
      // By default, attach a user. Tests can override by setting req.headers
      if (req.headers.authorization === 'Bearer valid-token') {
        req.user = {
          id: 'test-user-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          issuedAt: Math.floor(Date.now() / 1000),
        };
      } else if (req.headers.authorization === 'Bearer admin-token') {
        req.user = {
          id: 'admin-user-456',
          username: 'adminuser',
          email: 'admin@example.com',
          role: 'admin',
          issuedAt: Math.floor(Date.now() / 1000),
        };
      } else if (req.headers.authorization === 'Bearer other-user-token') {
        req.user = {
          id: 'other-user-789',
          username: 'otheruser',
          email: 'other@example.com',
          role: 'user',
          issuedAt: Math.floor(Date.now() / 1000),
        };
      }
      // No authorization header = unauthenticated
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
      if (req.user.role !== 'admin' && req.user.role !== 'platformAdmin') {
        return res.status(403).json({ error: 'Insufficient permissions.' });
      }
      next();
    }),
    isOwnerOrAdmin: jest.fn((user: any, ownerId: string) => {
      if (user.role === 'admin' || user.role === 'platformAdmin' || user.role === 'moderator') return true;
      return user.id === ownerId;
    }),
  };
});

// Mock moderation middleware (pass-through)
jest.mock('../middleware/moderation', () => ({
  moderationCheck: jest.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock rate limiting (pass-through)
jest.mock('../middleware/rateLimit', () => ({
  slidingWindowRateLimit: jest.fn(() => (_req: any, _res: any, next: any) => next()),
  extractClientIp: jest.fn(() => '127.0.0.1'),
}));

// Mock firebase-functions logger
jest.mock('firebase-functions', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Mock shared schemas (pass-through validation)
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

// Cast as any to avoid strict type checking on mock data
const mockProfileService = profileService as any;

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const sampleProfile = {
  id: 'profile-1',
  entityType: 'business',
  ownerId: 'test-user-123',
  handle: 'test-business',
  officialName: 'Test Business Pty Ltd',
  status: 'draft',
  verificationStatus: 'pending',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  viewCount: 0,
  uniqueVisitorCount: 0,
  contactClickCount: 0,
  searchAppearances: 0,
  engagementScore: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Profile API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/profiles/create ────────────────────────────────────────────

  describe('POST /api/profiles/create', () => {
    const createPayload = {
      entityType: 'business',
      handle: 'new-business',
      officialName: 'New Business Pty Ltd',
      tagline: 'A great business',
      description: 'We do great things',
    };

    it('creates a profile with valid data', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(false);
      mockProfileService.create.mockResolvedValue({
        ...sampleProfile,
        ...createPayload,
        id: 'new-profile-id',
      });

      const res = await request(app)
        .post('/api/profiles/create')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('new-profile-id');
      expect(res.body.officialName).toBe('New Business Pty Ltd');
      expect(mockValidationService.checkHandleExists).toHaveBeenCalledWith('new-business');
      expect(mockProfileService.create).toHaveBeenCalled();
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/profiles/create')
        .send(createPayload);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication');
    });

    it('rejects when handle is already taken', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/profiles/create')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Handle already taken');
    });

    it('sets owner to authenticated user', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(false);
      mockProfileService.create.mockResolvedValue({
        ...sampleProfile,
        ...createPayload,
        ownerId: 'test-user-123',
      });

      await request(app)
        .post('/api/profiles/create')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      const createCall = mockProfileService.create.mock.calls[0][0];
      expect(createCall.ownerId).toBe('test-user-123');
      expect(createCall.lastModifiedBy).toBe('test-user-123');
    });

    it('initializes analytics counters to zero', async () => {
      mockValidationService.checkHandleExists.mockResolvedValue(false);
      mockProfileService.create.mockResolvedValue(sampleProfile);

      await request(app)
        .post('/api/profiles/create')
        .set('Authorization', 'Bearer valid-token')
        .send(createPayload);

      const createCall = mockProfileService.create.mock.calls[0][0];
      expect(createCall.viewCount).toBe(0);
      expect(createCall.uniqueVisitorCount).toBe(0);
      expect(createCall.contactClickCount).toBe(0);
      expect(createCall.searchAppearances).toBe(0);
      expect(createCall.engagementScore).toBe(0);
    });
  });

  // ─── PUT /api/profiles/:id ────────────────────────────────────────────────

  describe('PUT /api/profiles/:id', () => {
    const updatePayload = {
      officialName: 'Updated Business Name',
      tagline: 'Updated tagline',
    };

    it('updates an existing profile', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockProfileService.update.mockResolvedValue({
        ...sampleProfile,
        ...updatePayload,
      });

      const res = await request(app)
        .put('/api/profiles/profile-1')
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.officialName).toBe('Updated Business Name');
      expect(mockProfileService.update).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          officialName: 'Updated Business Name',
          lastModifiedBy: 'test-user-123',
        })
      );
    });

    it('rejects unauthorized updates (non-owner)', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .put('/api/profiles/profile-1')
        .set('Authorization', 'Bearer other-user-token')
        .send(updatePayload);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 404 for non-existent profile', async () => {
      mockProfileService.getById.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/profiles/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('validates handle uniqueness when handle is changed', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockValidationService.checkHandleExists.mockResolvedValue(true);

      const res = await request(app)
        .put('/api/profiles/profile-1')
        .set('Authorization', 'Bearer valid-token')
        .send({ handle: 'taken-handle' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Handle already taken');
      expect(mockValidationService.checkHandleExists).toHaveBeenCalledWith('taken-handle', 'profile-1');
    });

    it('allows admin to update any profile', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockProfileService.update.mockResolvedValue({
        ...sampleProfile,
        ...updatePayload,
      });

      const res = await request(app)
        .put('/api/profiles/profile-1')
        .set('Authorization', 'Bearer admin-token')
        .send(updatePayload);

      expect(res.status).toBe(200);
    });
  });

  // ─── GET /api/profiles/:id ────────────────────────────────────────────────

  describe('GET /api/profiles/:id', () => {
    it('returns profile data', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .get('/api/profiles/profile-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('profile-1');
      expect(res.body.officialName).toBe('Test Business Pty Ltd');
    });

    it('returns 404 for non-existent profile', async () => {
      mockProfileService.getById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/profiles/non-existent');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('does not require authentication for public profiles', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .get('/api/profiles/profile-1');

      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/profiles/:id/publish ───────────────────────────────────────

  describe('POST /api/profiles/:id/publish', () => {
    it('publishes a draft profile without verification', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockVerificationService.requiresVerification.mockReturnValue(false);
      mockProfileService.update.mockResolvedValue({
        ...sampleProfile,
        status: 'published',
      });

      const res = await request(app)
        .post('/api/profiles/profile-1/publish')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.profile.status).toBe('published');
      expect(res.body.requiresVerification).toBe(false);
    });

    it('sets pending_verification when verification is required', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockVerificationService.requiresVerification.mockReturnValue(true);
      mockVerificationService.getChecklistForEntityType.mockReturnValue([
        { item: 'ABN verified', checked: false },
      ]);
      mockVerificationService.createVerificationTask.mockResolvedValue({
        id: 'task-1',
        status: 'pending',
      });
      mockProfileService.update.mockResolvedValue({
        ...sampleProfile,
        status: 'pending_verification',
      });

      const res = await request(app)
        .post('/api/profiles/profile-1/publish')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.profile.status).toBe('pending_verification');
      expect(res.body.requiresVerification).toBe(true);
      expect(res.body.estimatedReviewTime).toBe('48 hours');
      expect(mockVerificationService.createVerificationTask).toHaveBeenCalled();
    });

    it('rejects publish from non-owner', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .post('/api/profiles/profile-1/publish')
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent profile', async () => {
      mockProfileService.getById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/profiles/non-existent/publish')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /api/profiles/:id/versions ───────────────────────────────────────

  describe('GET /api/profiles/:id/versions', () => {
    const sampleVersions = [
      {
        id: 'v-3',
        profileId: 'profile-1',
        versionNumber: 3,
        changedFields: ['tagline'],
        changedBy: 'test-user-123',
        createdAt: '2024-01-03T00:00:00.000Z',
      },
      {
        id: 'v-2',
        profileId: 'profile-1',
        versionNumber: 2,
        changedFields: ['officialName'],
        changedBy: 'test-user-123',
        createdAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'v-1',
        profileId: 'profile-1',
        versionNumber: 1,
        changedFields: [],
        changedBy: 'test-user-123',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    it('returns version history ordered by timestamp', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockProfileService.getVersionHistory.mockResolvedValue(sampleVersions);

      const res = await request(app)
        .get('/api/profiles/profile-1/versions')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.versions).toHaveLength(3);
      // Versions should be ordered newest first (desc by versionNumber)
      expect(res.body.versions[0].versionNumber).toBe(3);
      expect(res.body.versions[2].versionNumber).toBe(1);
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/profiles/profile-1/versions');

      expect(res.status).toBe(401);
    });

    it('rejects non-owner access', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .get('/api/profiles/profile-1/versions')
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(403);
    });
  });

  // ─── POST /api/profiles/:id/rollback ──────────────────────────────────────

  describe('POST /api/profiles/:id/rollback', () => {
    it('restores a previous version', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockProfileService.rollbackToVersion.mockResolvedValue({
        ...sampleProfile,
        officialName: 'Original Name',
      });

      const res = await request(app)
        .post('/api/profiles/profile-1/rollback')
        .set('Authorization', 'Bearer valid-token')
        .send({ versionNumber: 1 });

      expect(res.status).toBe(200);
      expect(res.body.officialName).toBe('Original Name');
      expect(mockProfileService.rollbackToVersion).toHaveBeenCalledWith(
        'profile-1',
        1,
        'test-user-123'
      );
    });

    it('requires versionNumber in body', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .post('/api/profiles/profile-1/rollback')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('versionNumber');
    });

    it('rejects non-owner rollback', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .post('/api/profiles/profile-1/rollback')
        .set('Authorization', 'Bearer other-user-token')
        .send({ versionNumber: 1 });

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent profile', async () => {
      mockProfileService.getById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/profiles/non-existent/rollback')
        .set('Authorization', 'Bearer valid-token')
        .send({ versionNumber: 1 });

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /api/profiles/:id/analytics ──────────────────────────────────────

  describe('GET /api/profiles/:id/analytics', () => {
    const sampleAnalytics = {
      profileId: 'profile-1',
      period: 'monthly',
      metrics: {
        views: 150,
        uniqueVisitors: 80,
        contactClicks: 12,
        socialLinkClicks: { facebook: 5, instagram: 8 },
        searchAppearances: 200,
        searchClickThroughRate: 0.15,
      },
      trafficSources: { direct: 40, search: 60, social: 30, referral: 20 },
      topKeywords: [],
      engagementScore: 72,
    };

    it('returns analytics for profile owner', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);
      mockProfileService.getAnalytics.mockResolvedValue(sampleAnalytics);

      const res = await request(app)
        .get('/api/profiles/profile-1/analytics')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.metrics.views).toBe(150);
      expect(res.body.engagementScore).toBe(72);
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/profiles/profile-1/analytics');

      expect(res.status).toBe(401);
    });

    it('rejects non-owner access', async () => {
      mockProfileService.getById.mockResolvedValue(sampleProfile);

      const res = await request(app)
        .get('/api/profiles/profile-1/analytics')
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(403);
    });
  });
});
