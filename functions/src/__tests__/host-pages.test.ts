/**
 * Host Pages API unit tests
 */

import request from 'supertest';
import { app } from '../app';

jest.mock('../admin', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      })),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    })),
    settings: jest.fn(),
  },
  authAdmin: { verifyIdToken: jest.fn() },
  storageBucket: null,
  projectId: 'test-project',
  isFirestoreConfigured: true,
}));

function buildMockPage() {
  return {
    id: 'page-1',
    entityType: 'venue' as const,
    ownerId: 'test-organizer-id',
    formData: {
      name: 'Test Venue',
      bio: 'A venue page with enough bio text for publish validation in unit tests.',
      categoryTags: ['Venue'],
      culturalTags: ['Multicultural'],
      languageTags: ['English'],
      logoUrl: 'https://example.com/logo.png',
      coverUrl: 'https://example.com/cover.png',
      membershipModel: 'free' as const,
    },
    status: 'draft' as const,
    verificationStatus: 'not_started' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastModifiedBy: 'test-organizer-id',
  };
}

const mockPage = buildMockPage();

jest.mock('../services/host-page.service', () => ({
  hostPageService: {
    getById: jest.fn(),
    listForOwner: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(() => Promise.resolve(buildMockPage())),
    update: jest.fn(),
    saveDraft: jest.fn().mockResolvedValue({
      id: 'draft-1',
      userId: 'test-organizer-id',
      entityType: 'venue',
      formData: buildMockPage().formData,
      currentStep: 1,
      completedSteps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    }),
    getUserDrafts: jest.fn().mockResolvedValue([]),
    getDraft: jest.fn(),
    deleteDraft: jest.fn(),
    publish: jest.fn().mockResolvedValue({
      page: { ...buildMockPage(), status: 'pending_verification' },
      verificationRequired: true,
      estimatedReviewTime: '24–48 hours',
    }),
    blockPage: jest.fn(),
    unblockPage: jest.fn(),
  },
}));

const { hostPageService } = jest.requireMock('../services/host-page.service');

describe('Host Pages API', () => {
  const organizerHeaders = { 'x-integration-test': 'organizer' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/host-pages/drafts saves a draft', async () => {
    const res = await request(app)
      .post('/api/host-pages/drafts')
      .set(organizerHeaders)
      .send({
        entityType: 'venue',
        formData: buildMockPage().formData,
        currentStep: 1,
        completedSteps: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.draftId).toBe('draft-1');
  });

  it('POST /api/host-pages creates a page', async () => {
    const res = await request(app)
      .post('/api/host-pages')
      .set(organizerHeaders)
      .send({
        entityType: 'venue',
        formData: buildMockPage().formData,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('page-1');
  });

  it('POST /api/host-pages/:id/publish returns verification required for venue', async () => {
    hostPageService.getById.mockResolvedValue(mockPage);

    const res = await request(app)
      .post('/api/host-pages/page-1/publish')
      .set(organizerHeaders);

    expect(res.status).toBe(200);
    expect(res.body.verificationRequired).toBe(true);
    expect(res.body.status).toBe('pending_verification');
  });

  it('GET /api/host-pages/my lists owner pages', async () => {
    const res = await request(app).get('/api/host-pages/my').set(organizerHeaders);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.pages)).toBe(true);
  });

  it('rejects unauthenticated draft save', async () => {
    const res = await request(app).post('/api/host-pages/drafts').send({
      entityType: 'venue',
      formData: buildMockPage().formData,
      currentStep: 1,
    });
    expect(res.status).toBe(401);
  });
});