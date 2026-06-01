import request from 'supertest';
import { app } from '../app';
import { db } from '../admin';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';

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

describe('Council / LGA API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/council/nearest', () => {
    it('returns nearest council by coordinate', async () => {
      const mockCouncils = [
        {
          id: 'council-1',
          data: () => ({
            name: 'City of Sydney',
            state: 'NSW',
            lgaCode: '15050',
            latitude: -33.8688,
            longitude: 151.2093,
          }),
        },
        {
          id: 'council-2',
          data: () => ({
            name: 'Randwick City Council',
            state: 'NSW',
            lgaCode: '16550',
            latitude: -33.9167,
            longitude: 151.2500,
          }),
        },
      ];

      const mockGet = (jest.fn() as any).mockResolvedValue({
        docs: mockCouncils,
      });

      const mockWhere = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
        limit: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      (db.collection as jest.Mock).mockImplementation(mockCollection);

      const res = await request(app)
        .get('/api/council/nearest')
        .query({
          latitude: -33.8688,
          longitude: 151.2093,
          country: 'Australia',
        });

      expect(res.status).toBe(200);
      expect(res.body.council.id).toBe('council-1');
      expect(res.body.matchMethod).toBe('coordinate');
      expect(res.body.confidence).toBe('strong');
      expect(res.body.distanceKm).toBe(0);
    });

    it('falls back to city-state matching if no coordinate is provided', async () => {
      const mockCouncils = [
        {
          id: 'council-1',
          data: () => ({
            name: 'Randwick City Council',
            state: 'NSW',
            lgaCode: '16550',
            city: 'Randwick',
            suburb: 'Randwick',
          }),
        },
      ];

      const mockGet = (jest.fn() as any).mockResolvedValue({
        docs: mockCouncils,
      });

      const mockWhere = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      const mockCollection = jest.fn().mockReturnValue({
        where: mockWhere,
        limit: jest.fn().mockReturnValue({
          get: mockGet,
        }),
      });

      (db.collection as jest.Mock).mockImplementation(mockCollection);

      const res = await request(app)
        .get('/api/council/nearest')
        .query({
          city: 'Randwick',
          state: 'NSW',
          country: 'Australia',
        });

      expect(res.status).toBe(200);
      expect(res.body.council.id).toBe('council-1');
      expect(res.body.matchMethod).toBe('city-state');
      expect(res.body.confidence).toBe('medium');
    });
  });
});
