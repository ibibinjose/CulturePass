import { describe, it, expect } from '@jest/globals';
import {
  ProfileDraftSchema,
  CreateProfileDraftSchema,
  UpdateProfileDraftSchema,
  UpdateProfileDraftBodySchema,
} from '../hostProfileDraft';

describe('HostProfileDraft Schema', () => {
  const now = new Date().toISOString();

  describe('ProfileDraftSchema', () => {
    it('validates a stored draft document', () => {
      expect(() =>
        ProfileDraftSchema.parse({
          id: 'draft-1',
          userId: 'user-1',
          entityType: 'community',
          formData: { officialName: 'Kerala Society' },
          currentStep: 2,
          completedSteps: [1],
          createdAt: now,
          updatedAt: now,
          expiresAt: now,
        }),
      ).not.toThrow();
    });
  });

  describe('CreateProfileDraftSchema', () => {
    it('validates create payload without server timestamps', () => {
      expect(() =>
        CreateProfileDraftSchema.parse({
          userId: 'user-1',
          entityType: 'community',
          formData: {},
          currentStep: 1,
        }),
      ).not.toThrow();
    });
  });

  describe('UpdateProfileDraftSchema', () => {
    it('accepts partial updates without createdAt', () => {
      expect(() =>
        UpdateProfileDraftSchema.parse({
          id: 'draft-1',
          userId: 'user-1',
          currentStep: 4,
        }),
      ).not.toThrow();
    });
  });

  describe('UpdateProfileDraftBodySchema', () => {
    it('accepts route-scoped draft patch bodies', () => {
      expect(() =>
        UpdateProfileDraftBodySchema.parse({
          currentStep: 5,
          completedSteps: [1, 2, 3, 4],
        }),
      ).not.toThrow();
    });
  });
});