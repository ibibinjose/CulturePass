import { describe, it, expect } from '@jest/globals';
import {
  HostPageFormDataSchema,
  HostPageDraftFormDataSchema,
  HostPagePublishFormDataSchema,
  HostPageSchema,
  HostPageDraftSchema,
  UpdateHostPageDraftSchema,
  UpdateHostPageSchema,
  hostPageRequiresVerification,
  hostPageRequiresAbn,
  validateHostPagePublishFormData,
  getHostPageVerificationChecklist,
  clampHostPageHeritageFields,
  prepareHostPageDraftFormData,
  HOST_PAGE_TAG_LIST_MAX,
} from '../hostPage';

describe('HostPage Schema', () => {
  const baseFormData = {
    name: 'Kerala Cultural Society',
    bio: 'A vibrant diaspora community connecting Malayalee families across Sydney through festivals, language classes, and shared traditions.',
    categoryTags: ['Community', 'Festivals'],
    culturalTags: ['Indian', 'Multicultural'],
    languageTags: ['Malayalam', 'English'],
    cultureIds: [],
    indigenousTags: [],
    isIndigenousOwned: false,
    logoUrl: 'https://storage.example.com/logo.png',
    coverUrl: 'https://storage.example.com/cover.png',
    membershipModel: 'free' as const,
    gstRegistered: false,
    primaryContactMethod: 'email' as const,
    isOnlineOnly: false,
    socialLinks: [],
    executiveMembers: [],
  };

  describe('clampHostPageHeritageFields', () => {
    it('trims cultureIds to HOST_PAGE_TAG_LIST_MAX', () => {
      const ids = Array.from({ length: 15 }, (_, i) => `culture-${i}`);
      const clamped = clampHostPageHeritageFields({ cultureIds: ids });
      expect(clamped.cultureIds).toHaveLength(HOST_PAGE_TAG_LIST_MAX);
      expect(clamped.cultureIds?.[0]).toBe('culture-0');
    });
  });

  describe('HostPageDraftFormDataSchema', () => {
    it('allows partial autosave while the user is still typing', () => {
      expect(() =>
        HostPageDraftFormDataSchema.parse({
          name: 'T',
          bio: 'Still typing',
          categoryTags: ['Community'],
        }),
      ).not.toThrow();
    });

    it('prepareHostPageDraftFormData clamps heritage fields before save', () => {
      const ids = Array.from({ length: 15 }, (_, i) => `culture-${i}`);
      const prepared = prepareHostPageDraftFormData({
        name: 'Draft',
        bio: 'wip',
        cultureIds: ids,
      });
      expect(prepared?.cultureIds).toHaveLength(HOST_PAGE_TAG_LIST_MAX);
    });
  });

  describe('HostPageFormDataSchema', () => {
    it('validates create/update form data with minimum name and bio', () => {
      expect(() =>
        HostPageFormDataSchema.parse({
          name: 'Test Page',
          bio: 'Short bio for draft state only.',
          categoryTags: [],
        }),
      ).not.toThrow();
    });

    it('rejects bio shorter than 10 characters for page records', () => {
      expect(() =>
        HostPageFormDataSchema.parse({
          name: 'Test Page',
          bio: 'Too short',
          categoryTags: [],
        }),
      ).toThrow();
    });

    it('rejects more than 3 category tags', () => {
      expect(() =>
        HostPageFormDataSchema.parse({
          ...baseFormData,
          categoryTags: ['A', 'B', 'C', 'D'],
        }),
      ).toThrow();
    });
  });

  describe('HostPagePublishFormDataSchema', () => {
    it('validates publish-ready form data', () => {
      expect(() => HostPagePublishFormDataSchema.parse(baseFormData)).not.toThrow();
    });

    it('requires logo and cover on publish', () => {
      expect(() =>
        HostPagePublishFormDataSchema.parse({
          ...baseFormData,
          logoUrl: undefined,
        }),
      ).toThrow();
    });

    it('requires monthly fee for paid membership', () => {
      expect(() =>
        HostPagePublishFormDataSchema.parse({
          ...baseFormData,
          membershipModel: 'paid',
        }),
      ).toThrow();
    });
  });

  describe('HostPageSchema', () => {
    it('validates a complete host page document', () => {
      const now = new Date().toISOString();
      expect(() =>
        HostPageSchema.parse({
          id: 'page-1',
          entityType: 'community',
          ownerId: 'user-1',
          formData: baseFormData,
          status: 'draft',
          verificationStatus: 'not_started',
          createdAt: now,
          updatedAt: now,
          lastModifiedBy: 'user-1',
        }),
      ).not.toThrow();
    });
  });

  describe('HostPageDraftSchema', () => {
    it('validates draft with wizard step metadata', () => {
      const now = new Date().toISOString();
      expect(() =>
        HostPageDraftSchema.parse({
          id: 'draft-1',
          userId: 'user-1',
          entityType: 'venue',
          formData: { name: 'Indie Stage', bio: 'A grassroots venue for diaspora artists and intimate cultural nights.', categoryTags: ['Venue'] },
          currentStep: 2,
          completedSteps: [1],
          createdAt: now,
          updatedAt: now,
          expiresAt: now,
        }),
      ).not.toThrow();
    });
  });

  describe('UpdateHostPageDraftSchema', () => {
    it('accepts partial draft updates without createdAt', () => {
      expect(() =>
        UpdateHostPageDraftSchema.parse({
          id: 'draft-1',
          userId: 'user-1',
          currentStep: 3,
        }),
      ).not.toThrow();
    });
  });

  describe('UpdateHostPageSchema', () => {
    it('accepts partial page updates without ownerId or createdAt', () => {
      expect(() =>
        UpdateHostPageSchema.parse({
          id: 'page-1',
          status: 'published',
        }),
      ).not.toThrow();
    });
  });

  describe('hostPageRequiresVerification', () => {
    it('returns true for regulated entity types', () => {
      expect(hostPageRequiresVerification('venue')).toBe(true);
      expect(hostPageRequiresVerification('business')).toBe(true);
    });

    it('returns false for community and artist', () => {
      expect(hostPageRequiresVerification('community')).toBe(false);
      expect(hostPageRequiresVerification('artist')).toBe(false);
    });
  });

  describe('hostPageRequiresAbn', () => {
    it('requires ABN for business and venue', () => {
      expect(hostPageRequiresAbn('business')).toBe(true);
      expect(hostPageRequiresAbn('venue')).toBe(true);
      expect(hostPageRequiresAbn('community')).toBe(false);
    });
  });

  describe('validateHostPagePublishFormData', () => {
    it('requires public email for all entity types', () => {
      const result = validateHostPagePublishFormData(baseFormData, 'community');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues.some((i) => i.path === 'publicEmail')).toBe(true);
      }
    });

    it('requires ABN and executives for business publish', () => {
      const result = validateHostPagePublishFormData(
        { ...baseFormData, publicEmail: 'biz@example.com' },
        'business',
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues.some((i) => i.path === 'abn')).toBe(true);
        expect(result.issues.some((i) => i.path === 'executiveMembers')).toBe(true);
      }
    });
  });

  describe('getHostPageVerificationChecklist', () => {
    it('returns page-specific items for venue', () => {
      const checklist = getHostPageVerificationChecklist('venue');
      expect(checklist.length).toBeGreaterThan(3);
      expect(checklist[0].checked).toBe(false);
      expect(checklist.some((c) => c.item.includes('Venue name'))).toBe(true);
    });

    it('returns branding review items for artist', () => {
      const checklist = getHostPageVerificationChecklist('artist');
      expect(checklist.some((c) => c.item.toLowerCase().includes('logo'))).toBe(true);
    });
  });
});