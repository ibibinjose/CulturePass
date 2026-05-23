import { createProfilesNamespace } from '../createProfilesNamespace';
import type { ApiRequestFn } from '../../client';
import type { Profile } from '@/shared/schema';

describe('createProfilesNamespace', () => {
  let mockRequest: jest.MockedFunction<ApiRequestFn>;
  let profiles: ReturnType<typeof createProfilesNamespace>;

  beforeEach(() => {
    mockRequest = jest.fn();
    profiles = createProfilesNamespace(mockRequest);
  });

  describe('list', () => {
    it('should call request with correct parameters', async () => {
      mockRequest.mockResolvedValue({ profiles: [] });
      
      await profiles.list({ entityType: 'community', city: 'Sydney' });
      
      expect(mockRequest).toHaveBeenCalledWith(
        'GET',
        'api/profiles?entityType=community&city=Sydney'
      );
    });

    it('should return profiles array', async () => {
      const mockProfiles = [{ id: '1', entityType: 'community' }];
      mockRequest.mockResolvedValue({ profiles: mockProfiles });
      
      const result = await profiles.list();
      
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('get', () => {
    it('should call request with profile ID', () => {
      profiles.get('profile-123');
      
      expect(mockRequest).toHaveBeenCalledWith('GET', 'api/profiles/profile-123');
    });
  });

  describe('create', () => {
    it('should call request with profile payload', () => {
      const payload: Partial<Profile> = { entityType: 'community', name: 'Test Community' };
      profiles.create(payload);
      
      expect(mockRequest).toHaveBeenCalledWith('POST', 'api/profiles', payload);
    });
  });

  describe('update', () => {
    it('should call request with profile ID and payload', () => {
      const payload: Partial<Profile> = { name: 'Updated Name' };
      profiles.update('profile-123', payload);
      
      expect(mockRequest).toHaveBeenCalledWith('PUT', 'api/profiles/profile-123', payload);
    });
  });

  describe('saveDraft', () => {
    it('should call request with draft data', () => {
      const draftData = {
        formData: { name: 'Draft' } as Partial<Profile>,
        currentStep: 2,
        completedSteps: [1],
        entityType: 'community',
      };
      
      profiles.saveDraft('draft-123', draftData);
      
      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        'api/profiles/draft-123/draft',
        draftData
      );
    });
  });

  describe('getDrafts', () => {
    it('should call request and return drafts array', async () => {
      const mockDrafts = [{ id: 'draft-1', entityType: 'community' }];
      mockRequest.mockResolvedValue({ drafts: mockDrafts });
      
      const result = await profiles.getDrafts();
      
      expect(mockRequest).toHaveBeenCalledWith('GET', 'api/profiles/drafts');
      expect(result).toEqual(mockDrafts);
    });

    it('should filter by entity type', async () => {
      mockRequest.mockResolvedValue({ drafts: [] });
      
      await profiles.getDrafts({ entityType: 'venue' });
      
      expect(mockRequest).toHaveBeenCalledWith('GET', 'api/profiles/drafts?entityType=venue');
    });
  });

  describe('handleAvailable', () => {
    it('should check handle availability', () => {
      profiles.handleAvailable('test-handle');
      
      expect(mockRequest).toHaveBeenCalledWith(
        'GET',
        'api/profiles/handles/available?handle=test-handle'
      );
    });

    it('should strip @ prefix from handle', () => {
      profiles.handleAvailable('@test-handle');
      
      expect(mockRequest).toHaveBeenCalledWith(
        'GET',
        'api/profiles/handles/available?handle=test-handle'
      );
    });
  });

  describe('abnLookup', () => {
    it('should call ABN lookup endpoint', () => {
      profiles.abnLookup('12345678901');
      
      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        'api/profiles/abn-lookup',
        { abn: '12345678901' }
      );
    });
  });

  describe('getVersions', () => {
    it('should get version history', async () => {
      const mockVersions = [{ id: 'v1', versionNumber: 1 }];
      mockRequest.mockResolvedValue({ versions: mockVersions });
      
      const result = await profiles.getVersions('profile-123');
      
      expect(mockRequest).toHaveBeenCalledWith('GET', 'api/profiles/profile-123/versions');
      expect(result).toEqual(mockVersions);
    });

    it('should support limit parameter', async () => {
      mockRequest.mockResolvedValue({ versions: [] });
      
      await profiles.getVersions('profile-123', { limit: 10 });
      
      expect(mockRequest).toHaveBeenCalledWith(
        'GET',
        'api/profiles/profile-123/versions?limit=10'
      );
    });
  });

  describe('rollback', () => {
    it('should rollback to specific version', () => {
      profiles.rollback('profile-123', 5);
      
      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        'api/profiles/profile-123/rollback',
        { versionNumber: 5 }
      );
    });
  });

  describe('getAnalytics', () => {
    it('should get analytics for profile', () => {
      profiles.getAnalytics('profile-123');
      
      expect(mockRequest).toHaveBeenCalledWith('GET', 'api/profiles/profile-123/analytics');
    });

    it('should support period and date filters', () => {
      profiles.getAnalytics('profile-123', {
        period: 'weekly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      
      expect(mockRequest).toHaveBeenCalledWith(
        'GET',
        'api/profiles/profile-123/analytics?period=weekly&startDate=2024-01-01&endDate=2024-01-31'
      );
    });
  });

  describe('publish', () => {
    it('should publish a profile', () => {
      profiles.publish('profile-123');
      
      expect(mockRequest).toHaveBeenCalledWith('POST', 'api/profiles/profile-123/publish');
    });
  });
});
