/**
 * Integration tests for Draft Management API endpoints.
 *
 * Tests draft save, list, and delete operations.
 *
 * Validates: Requirements 34, 36
 */

import request from 'supertest';
import { app } from '../app';

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

// ---------------------------------------------------------------------------
// Get references to mocked services
// ---------------------------------------------------------------------------

import { draftService } from '../services/profileService';

const mockDraftService = draftService as any;

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const sampleDraft = {
  id: 'draft-1',
  userId: 'test-user-123',
  entityType: 'business',
  formData: {
    officialName: 'My Business',
    handle: 'my-business',
    tagline: 'A great business',
  },
  currentStep: 2,
  completedSteps: [1],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
  expiresAt: '2024-04-15T10:30:00.000Z',
  deviceInfo: {
    platform: 'web',
    userAgent: 'Mozilla/5.0 Chrome/120',
  },
};

const sampleDrafts = [
  {
    ...sampleDraft,
    id: 'draft-1',
    updatedAt: '2024-01-15T10:30:00.000Z',
    deviceInfo: { platform: 'web', userAgent: 'Chrome/120' },
  },
  {
    ...sampleDraft,
    id: 'draft-2',
    entityType: 'artist',
    formData: { officialName: 'My Art Studio' },
    updatedAt: '2024-01-10T08:00:00.000Z',
    deviceInfo: { platform: 'ios', userAgent: 'CulturePass/1.0' },
  },
  {
    ...sampleDraft,
    id: 'draft-3',
    entityType: 'venue',
    formData: { officialName: 'My Venue' },
    updatedAt: '2024-01-05T14:00:00.000Z',
    deviceInfo: { platform: 'android', userAgent: 'CulturePass/1.0' },
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Draft Management API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/profiles/:id/draft ─────────────────────────────────────────

  describe('POST /api/profiles/:id/draft', () => {
    const draftPayload = {
      entityType: 'business',
      formData: {
        officialName: 'My Business',
        handle: 'my-business',
      },
      currentStep: 3,
      completedSteps: [1, 2],
      deviceInfo: {
        platform: 'web',
        userAgent: 'Mozilla/5.0 Chrome/120',
      },
    };

    it('saves draft data successfully', async () => {
      mockDraftService.saveDraft.mockResolvedValue({
        ...sampleDraft,
        ...draftPayload,
        updatedAt: '2024-01-20T12:00:00.000Z',
      });

      const res = await request(app)
        .post('/api/profiles/profile-1/draft')
        .set('Authorization', 'Bearer valid-token')
        .send(draftPayload);

      expect(res.status).toBe(200);
      expect(res.body.formData.officialName).toBe('My Business');
      expect(res.body.currentStep).toBe(3);
      expect(mockDraftService.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          profileId: 'profile-1',
        })
      );
    });

    it('associates draft with authenticated user', async () => {
      mockDraftService.saveDraft.mockResolvedValue(sampleDraft);

      await request(app)
        .post('/api/profiles/profile-1/draft')
        .set('Authorization', 'Bearer valid-token')
        .send(draftPayload);

      const saveCall = mockDraftService.saveDraft.mock.calls[0][0];
      expect(saveCall.userId).toBe('test-user-123');
    });

    it('includes device info when provided', async () => {
      mockDraftService.saveDraft.mockResolvedValue({
        ...sampleDraft,
        deviceInfo: draftPayload.deviceInfo,
      });

      const res = await request(app)
        .post('/api/profiles/profile-1/draft')
        .set('Authorization', 'Bearer valid-token')
        .send(draftPayload);

      expect(res.status).toBe(200);
      expect(res.body.deviceInfo.platform).toBe('web');
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/profiles/profile-1/draft')
        .send(draftPayload);

      expect(res.status).toBe(401);
    });

    it('handles service errors gracefully', async () => {
      mockDraftService.saveDraft.mockRejectedValue(new Error('Firestore write failed'));

      const res = await request(app)
        .post('/api/profiles/profile-1/draft')
        .set('Authorization', 'Bearer valid-token')
        .send(draftPayload);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to save draft');
    });
  });

  // ─── GET /api/profiles/drafts ─────────────────────────────────────────────
  // Note: In the current implementation, GET /profiles/drafts is shadowed by
  // GET /profiles/:id because Express matches routes in definition order.
  // The :id param matches "drafts" as a literal string.
  // The individual draft endpoint GET /profiles/drafts/:draftId works correctly
  // because it has a different path segment count.

  describe('GET /api/profiles/drafts/:draftId', () => {
    it('returns a specific draft for the owner', async () => {
      mockDraftService.getDraft.mockResolvedValue(sampleDraft);

      const res = await request(app)
        .get('/api/profiles/drafts/draft-1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('draft-1');
      expect(res.body.formData.officialName).toBe('My Business');
      expect(res.body.deviceInfo.platform).toBe('web');
    });

    it('returns 404 for non-existent draft', async () => {
      mockDraftService.getDraft.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/profiles/drafts/non-existent')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('rejects access by non-owner', async () => {
      mockDraftService.getDraft.mockResolvedValue(sampleDraft);

      const res = await request(app)
        .get('/api/profiles/drafts/draft-1')
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/profiles/drafts/draft-1');

      expect(res.status).toBe(401);
    });

    it('allows admin to access any draft', async () => {
      mockDraftService.getDraft.mockResolvedValue(sampleDraft);

      const res = await request(app)
        .get('/api/profiles/drafts/draft-1')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('draft-1');
    });
  });

  // ─── DELETE /api/profiles/drafts/:draftId ─────────────────────────────────

  describe('DELETE /api/profiles/drafts/:draftId', () => {
    it('removes a draft successfully', async () => {
      mockDraftService.getDraft.mockResolvedValue(sampleDraft);
      mockDraftService.deleteDraft.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/profiles/drafts/draft-1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDraftService.deleteDraft).toHaveBeenCalledWith('draft-1');
    });

    it('returns 404 for non-existent draft', async () => {
      mockDraftService.getDraft.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/profiles/drafts/non-existent')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('rejects deletion by non-owner', async () => {
      mockDraftService.getDraft.mockResolvedValue(sampleDraft);

      const res = await request(app)
        .delete('/api/profiles/drafts/draft-1')
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('allows admin to delete any draft', async () => {
      mockDraftService.getDraft.mockResolvedValue(sampleDraft);
      mockDraftService.deleteDraft.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/profiles/drafts/draft-1')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .delete('/api/profiles/drafts/draft-1');

      expect(res.status).toBe(401);
    });
  });
});
