/**
 * Community directory — host page → profile sync mapping
 */

import type { HostPage } from '../../../shared/schema/hostPage';
import {
  mapHostPageToProfileFields,
  toCommunityDto,
  isListedCommunityProfile,
} from '../services/communityDirectory';
import type { FirestoreProfile } from '../services/profiles';

function buildCommunityHostPage(overrides: Partial<HostPage> = {}): HostPage {
  const now = '2026-06-01T00:00:00.000Z';
  return {
    id: 'page-community-1',
    entityType: 'community',
    ownerId: 'user-1',
    formData: {
      name: 'Malayalee Association Sydney',
      bio: 'A vibrant diaspora community connecting families across Sydney through festivals and language classes.',
      categoryTags: ['cultural'],
      culturalTags: ['Malayalee'],
      languageTags: ['Malayalam', 'English'],
      cultureIds: ['malayali'],
      nationalityId: 'indian',
      indigenousTags: [],
      isIndigenousOwned: false,
      membershipModel: 'free',
      logoUrl: 'https://example.com/logo.png',
      coverUrl: 'https://example.com/cover.png',
      publicEmail: 'hello@example.com',
      phoneNumber: '+61400000000',
      primaryContactMethod: 'email',
      primaryAddress: {
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        isPrimary: true,
      },
      socialLinks: [
        { platform: 'website', url: 'https://example.com', verified: false },
        { platform: 'instagram', url: 'https://instagram.com/example', verified: false },
      ],
      executiveMembers: [],
      gstRegistered: false,
      isOnlineOnly: false,
    },
    status: 'published',
    verificationStatus: 'not_started',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    lastModifiedBy: 'user-1',
    ...overrides,
  };
}

describe('communityDirectory', () => {
  it('maps published community host page fields onto a directory profile', () => {
    const page = buildCommunityHostPage();
    const mapped = mapHostPageToProfileFields(page, '2026-06-02T00:00:00.000Z');

    expect(mapped.entityType).toBe('community');
    expect(mapped.name).toBe('Malayalee Association Sydney');
    expect(mapped.status).toBe('published');
    expect(mapped.city).toBe('Sydney');
    expect(mapped.country).toBe('Australia');
    expect(mapped.hostPageId).toBe('page-community-1');
    expect(mapped.joinMode).toBe('open');
    expect(mapped.website).toBe('https://example.com');
    expect(mapped.instagram).toBe('https://instagram.com/example');
  });

  it('exposes community DTO shape for the Community tab', () => {
    const profile: FirestoreProfile = {
      id: 'page-community-1',
      name: 'Test Hub',
      entityType: 'community',
      city: 'Sydney',
      country: 'Australia',
      status: 'published',
      memberCount: 12,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };

    const dto = toCommunityDto(profile);
    expect(dto.type).toBe('community');
    expect(dto.membersCount).toBe(12);
    expect(dto.memberCount).toBe(12);
    expect(isListedCommunityProfile(profile)).toBe(true);
  });

  it('hides draft directory profiles from discovery', () => {
    const draft: FirestoreProfile = {
      id: 'draft-1',
      name: 'Draft Hub',
      entityType: 'community',
      status: 'draft',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    expect(isListedCommunityProfile(draft)).toBe(false);
  });
});