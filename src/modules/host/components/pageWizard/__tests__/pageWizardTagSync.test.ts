import { describe, it, expect } from '@jest/globals';
import {
  buildSyncedCulturalTags,
  canAddDiscoveryTag,
  discoveryCulturalTags,
} from '../pageWizardTagSync';
import type { HostPageFormData } from '@/shared/schema';

describe('pageWizardTagSync', () => {
  const base: HostPageFormData = {
    name: 'Test',
    bio: 'A test page bio with enough characters.',
    categoryTags: [],
    culturalTags: ['Family-Friendly', 'Gujarati'],
    languageTags: [],
    cultureIds: ['gujarati'],
    indigenousTags: [],
    isIndigenousOwned: false,
    gstRegistered: false,
    primaryContactMethod: 'email',
    isOnlineOnly: false,
    socialLinks: [],
    executiveMembers: [],
    membershipModel: 'free',
  };

  it('extracts discovery presets from culturalTags', () => {
    expect(discoveryCulturalTags(base.culturalTags)).toEqual(['Family-Friendly']);
  });

  it('blocks discovery adds when heritage picks already fill culturalTags', () => {
    const full: HostPageFormData = {
      ...base,
      cultureIds: Array.from({ length: 12 }, (_, i) => `culture_${i}`),
      culturalTags: Array.from({ length: 12 }, (_, i) => `culture_${i}`),
    };
    expect(canAddDiscoveryTag(full, 'Family-Friendly')).toBe(false);
    expect(canAddDiscoveryTag(full, 'Family-Friendly', ['Family-Friendly'])).toBe(true);
  });

  it('merges discovery, culture labels, and indigenous without exceeding limit', () => {
    const synced = buildSyncedCulturalTags(base, {
      cultureIds: ['gujarati', 'cantonese'],
      indigenousTags: ['gadigal'],
    });
    expect(synced).toContain('Family-Friendly');
    expect(synced).toContain('Gujarati');
    expect(synced).toContain('Gadigal');
    expect(synced.length).toBeLessThanOrEqual(12);
  });
});