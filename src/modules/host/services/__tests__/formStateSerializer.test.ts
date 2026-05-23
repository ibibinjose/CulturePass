/**
 * formStateSerializer Tests
 *
 * Tests for the form state serialization/deserialization service.
 * Covers JSON serialization, deserialization, partial data handling,
 * special types (dates, arrays, nested objects), and roundtrip integrity.
 */

import {
  serializeFormData,
  deserializeFormData,
  mergeFormData,
  calculateFormDiff,
  validateFormDataStructure,
} from '../formStateSerializer';
import type { PartialFormData } from '../formStateSerializer';

describe('formStateSerializer', () => {
  // -------------------------------------------------------------------------
  // serializeFormData
  // -------------------------------------------------------------------------

  describe('serializeFormData', () => {
    it('serializes basic form data to JSON string', () => {
      const formData: PartialFormData = {
        entityType: 'community',
        officialName: 'Test Community',
        handle: 'test-community',
      };

      const result = serializeFormData(formData);
      const parsed = JSON.parse(result);

      expect(parsed.entityType).toBe('community');
      expect(parsed.officialName).toBe('Test Community');
      expect(parsed.handle).toBe('test-community');
    });

    it('skips undefined values', () => {
      const formData: PartialFormData = {
        entityType: 'venue',
        officialName: 'My Venue',
        tradingName: undefined,
      };

      const result = serializeFormData(formData);
      const parsed = JSON.parse(result);

      expect(parsed.entityType).toBe('venue');
      expect(parsed.officialName).toBe('My Venue');
      expect('tradingName' in parsed).toBe(false);
    });

    it('serializes Date objects to ISO strings', () => {
      const date = new Date('2024-06-15T10:30:00.000Z');
      const formData = {
        entityType: 'business' as const,
        foundingDate: date,
      } as unknown as PartialFormData;

      const result = serializeFormData(formData);
      const parsed = JSON.parse(result);

      expect(parsed.foundingDate).toBe('2024-06-15T10:30:00.000Z');
    });

    it('serializes arrays correctly', () => {
      const formData: PartialFormData = {
        entityType: 'artist',
        galleryImages: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
        ],
        categoryTags: ['music', 'performance', 'live'],
      };

      const result = serializeFormData(formData);
      const parsed = JSON.parse(result);

      expect(parsed.galleryImages).toEqual([
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
      ]);
      expect(parsed.categoryTags).toEqual(['music', 'performance', 'live']);
    });

    it('serializes nested objects', () => {
      const formData: PartialFormData = {
        entityType: 'venue',
        primaryAddress: {
          street: '123 Main St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia',
          latitude: -33.8688,
          longitude: 151.2093,
          isPrimary: true,
        },
      };

      const result = serializeFormData(formData);
      const parsed = JSON.parse(result);

      expect(parsed.primaryAddress.street).toBe('123 Main St');
      expect(parsed.primaryAddress.city).toBe('Sydney');
      expect(parsed.primaryAddress.latitude).toBe(-33.8688);
    });

    it('excludes metadata fields by default', () => {
      const formData = {
        entityType: 'community' as const,
        officialName: 'Test',
        id: 'profile-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
        viewCount: 100,
        engagementScore: 5.5,
      } as unknown as PartialFormData;

      const result = serializeFormData(formData);
      const parsed = JSON.parse(result);

      expect(parsed.officialName).toBe('Test');
      expect('id' in parsed).toBe(false);
      expect('createdAt' in parsed).toBe(false);
      expect('updatedAt' in parsed).toBe(false);
      expect('viewCount' in parsed).toBe(false);
      expect('engagementScore' in parsed).toBe(false);
    });

    it('includes metadata fields when option is set', () => {
      const formData = {
        entityType: 'community' as const,
        officialName: 'Test',
        id: 'profile-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        viewCount: 100,
      } as unknown as PartialFormData;

      const result = serializeFormData(formData, { includeMetadata: true });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('profile-123');
      expect(parsed.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(parsed.viewCount).toBe(100);
    });

    it('supports pretty print option', () => {
      const formData: PartialFormData = {
        entityType: 'community',
        officialName: 'Test',
      };

      const compact = serializeFormData(formData);
      const pretty = serializeFormData(formData, { prettyPrint: true });

      expect(compact).not.toContain('\n');
      expect(pretty).toContain('\n');
    });

    it('handles arrays with nested objects', () => {
      const formData: PartialFormData = {
        entityType: 'business',
        socialLinks: [
          {
            platform: 'instagram',
            url: 'https://instagram.com/test',
            verified: true,
          },
          {
            platform: 'facebook',
            url: 'https://facebook.com/test',
            verified: false,
          },
        ],
      };

      const result = serializeFormData(formData);
      const parsed = JSON.parse(result);

      expect(parsed.socialLinks).toHaveLength(2);
      expect(parsed.socialLinks[0].platform).toBe('instagram');
      expect(parsed.socialLinks[1].verified).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // deserializeFormData
  // -------------------------------------------------------------------------

  describe('deserializeFormData', () => {
    it('deserializes JSON string to form data', () => {
      const json = JSON.stringify({
        entityType: 'organiser',
        officialName: 'Event Co',
        handle: 'event-co',
      });

      const result = deserializeFormData(json);

      expect(result.entityType).toBe('organiser');
      expect(result.officialName).toBe('Event Co');
      expect(result.handle).toBe('event-co');
    });

    it('handles nested objects', () => {
      const json = JSON.stringify({
        entityType: 'venue',
        primaryAddress: {
          street: '456 Park Ave',
          city: 'Melbourne',
          state: 'VIC',
          postcode: '3000',
          country: 'Australia',
          latitude: -37.8136,
          longitude: 144.9631,
          isPrimary: true,
        },
      });

      const result = deserializeFormData(json);

      expect(result.primaryAddress).toBeDefined();
      expect((result.primaryAddress as any).city).toBe('Melbourne');
      expect((result.primaryAddress as any).latitude).toBe(-37.8136);
    });

    it('handles arrays', () => {
      const json = JSON.stringify({
        entityType: 'artist',
        categoryTags: ['art', 'painting', 'sculpture'],
        galleryImages: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      });

      const result = deserializeFormData(json);

      expect(result.categoryTags).toEqual(['art', 'painting', 'sculpture']);
      expect(result.galleryImages).toEqual([
        'https://example.com/a.jpg',
        'https://example.com/b.jpg',
      ]);
    });

    it('preserves ISO date strings as strings', () => {
      const json = JSON.stringify({
        entityType: 'community',
        foundingDate: '2020-03-15',
      });

      const result = deserializeFormData(json);

      expect(result.foundingDate).toBe('2020-03-15');
      expect(typeof result.foundingDate).toBe('string');
    });

    it('preserves ISO datetime strings as strings', () => {
      const json = JSON.stringify({
        entityType: 'community',
        foundingDate: '2020-03-15T10:30:00.000Z',
      });

      const result = deserializeFormData(json);

      expect(result.foundingDate).toBe('2020-03-15T10:30:00.000Z');
    });

    it('throws on invalid JSON', () => {
      expect(() => deserializeFormData('not valid json')).toThrow('Invalid form data format');
    });

    it('handles null values', () => {
      const json = JSON.stringify({
        entityType: 'professional',
        tradingName: null,
        videoUrl: null,
      });

      const result = deserializeFormData(json);

      expect(result.tradingName).toBeNull();
      expect(result.videoUrl).toBeNull();
    });

    it('handles empty objects', () => {
      const json = JSON.stringify({});
      const result = deserializeFormData(json);
      expect(result).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // Roundtrip (serialize → deserialize)
  // -------------------------------------------------------------------------

  describe('roundtrip integrity', () => {
    it('preserves data through serialize → deserialize cycle', () => {
      const formData: PartialFormData = {
        entityType: 'community',
        officialName: 'My Community',
        handle: 'my-community',
        tagline: 'A great community',
        categoryTags: ['culture', 'music', 'art'],
        gstRegistered: false,
        isOnlineOnly: true,
      };

      const serialized = serializeFormData(formData);
      const deserialized = deserializeFormData(serialized);

      expect(deserialized.entityType).toBe(formData.entityType);
      expect(deserialized.officialName).toBe(formData.officialName);
      expect(deserialized.handle).toBe(formData.handle);
      expect(deserialized.tagline).toBe(formData.tagline);
      expect(deserialized.categoryTags).toEqual(formData.categoryTags);
      expect(deserialized.gstRegistered).toBe(false);
      expect(deserialized.isOnlineOnly).toBe(true);
    });

    it('preserves nested objects through roundtrip', () => {
      const formData: PartialFormData = {
        entityType: 'venue',
        primaryAddress: {
          street: '789 Queen St',
          city: 'Brisbane',
          state: 'QLD',
          postcode: '4000',
          country: 'Australia',
          latitude: -27.4698,
          longitude: 153.0251,
          isPrimary: true,
          lgaCode: 'BCC',
        },
      };

      const serialized = serializeFormData(formData);
      const deserialized = deserializeFormData(serialized);

      expect(deserialized.primaryAddress).toEqual(formData.primaryAddress);
    });

    it('preserves arrays of objects through roundtrip', () => {
      const formData: PartialFormData = {
        entityType: 'business',
        socialLinks: [
          { platform: 'instagram', url: 'https://instagram.com/biz', verified: true },
          { platform: 'website', url: 'https://mybiz.com', verified: false },
        ],
      };

      const serialized = serializeFormData(formData);
      const deserialized = deserializeFormData(serialized);

      expect(deserialized.socialLinks).toEqual(formData.socialLinks);
    });
  });

  // -------------------------------------------------------------------------
  // mergeFormData
  // -------------------------------------------------------------------------

  describe('mergeFormData', () => {
    it('merges form data with defaults', () => {
      const formData: PartialFormData = {
        entityType: 'community',
        officialName: 'My Community',
      };

      const defaults: PartialFormData = {
        entityType: 'community',
        officialName: 'Default Name',
        handle: 'default-handle',
        gstRegistered: false,
      };

      const result = mergeFormData(formData, defaults);

      expect(result.officialName).toBe('My Community'); // formData wins
      expect(result.handle).toBe('default-handle'); // from defaults
      expect(result.gstRegistered).toBe(false); // from defaults
    });

    it('deep merges entity-specific data', () => {
      const formData: PartialFormData = {
        entityType: 'community',
        communityData: {
          membershipModel: 'paid',
          monthlyFee: 1500,
        } as any,
      };

      const defaults: PartialFormData = {
        entityType: 'community',
        communityData: {
          membershipModel: 'free',
          membershipCount: 0,
          growthData: [],
          guidelines: '',
        } as any,
      };

      const result = mergeFormData(formData, defaults);

      expect((result.communityData as any).membershipModel).toBe('paid');
      expect((result.communityData as any).monthlyFee).toBe(1500);
      expect((result.communityData as any).membershipCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // calculateFormDiff
  // -------------------------------------------------------------------------

  describe('calculateFormDiff', () => {
    it('detects changed fields', () => {
      const oldData: PartialFormData = {
        entityType: 'community',
        officialName: 'Old Name',
        handle: 'old-handle',
      };

      const newData: PartialFormData = {
        entityType: 'community',
        officialName: 'New Name',
        handle: 'old-handle',
      };

      const diff = calculateFormDiff(oldData, newData);

      expect(diff).toContain('officialName');
      expect(diff).not.toContain('handle');
      expect(diff).not.toContain('entityType');
    });

    it('detects added fields', () => {
      const oldData: PartialFormData = {
        entityType: 'community',
      };

      const newData: PartialFormData = {
        entityType: 'community',
        officialName: 'New Name',
        tagline: 'A tagline',
      };

      const diff = calculateFormDiff(oldData, newData);

      expect(diff).toContain('officialName');
      expect(diff).toContain('tagline');
    });

    it('detects removed fields', () => {
      const oldData: PartialFormData = {
        entityType: 'community',
        officialName: 'Name',
        tagline: 'A tagline',
      };

      const newData: PartialFormData = {
        entityType: 'community',
        officialName: 'Name',
      };

      const diff = calculateFormDiff(oldData, newData);

      expect(diff).toContain('tagline');
      expect(diff).not.toContain('officialName');
    });

    it('detects nested object changes', () => {
      const oldData: PartialFormData = {
        entityType: 'venue',
        primaryAddress: {
          street: '123 Main St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia',
          latitude: -33.8688,
          longitude: 151.2093,
          isPrimary: true,
        },
      };

      const newData: PartialFormData = {
        entityType: 'venue',
        primaryAddress: {
          street: '456 Park Ave',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia',
          latitude: -33.8688,
          longitude: 151.2093,
          isPrimary: true,
        },
      };

      const diff = calculateFormDiff(oldData, newData);

      expect(diff).toContain('primaryAddress');
      expect(diff).toContain('primaryAddress.street');
    });

    it('returns empty array when no changes', () => {
      const data: PartialFormData = {
        entityType: 'community',
        officialName: 'Same Name',
      };

      const diff = calculateFormDiff(data, data);

      expect(diff).toEqual([]);
    });

    it('detects array changes', () => {
      const oldData: PartialFormData = {
        entityType: 'artist',
        categoryTags: ['music', 'art'],
      };

      const newData: PartialFormData = {
        entityType: 'artist',
        categoryTags: ['music', 'art', 'performance'],
      };

      const diff = calculateFormDiff(oldData, newData);

      expect(diff).toContain('categoryTags');
    });
  });

  // -------------------------------------------------------------------------
  // validateFormDataStructure
  // -------------------------------------------------------------------------

  describe('validateFormDataStructure', () => {
    it('returns true for valid form data with entityType', () => {
      expect(validateFormDataStructure({ entityType: 'community' })).toBe(true);
      expect(validateFormDataStructure({ entityType: 'venue', officialName: 'Test' })).toBe(true);
    });

    it('returns true for empty object', () => {
      expect(validateFormDataStructure({})).toBe(true);
    });

    it('returns false for non-object values', () => {
      expect(validateFormDataStructure(null)).toBe(false);
      expect(validateFormDataStructure(undefined)).toBe(false);
      expect(validateFormDataStructure('string')).toBe(false);
      expect(validateFormDataStructure(123)).toBe(false);
    });

    it('returns false for object with data but no entityType', () => {
      expect(validateFormDataStructure({ officialName: 'Test' })).toBe(false);
    });

    it('returns false for invalid entityType', () => {
      expect(validateFormDataStructure({ entityType: 'invalid' })).toBe(false);
      expect(validateFormDataStructure({ entityType: 'COMMUNITY' })).toBe(false);
    });

    it('accepts all valid entity types', () => {
      const validTypes = ['community', 'organiser', 'venue', 'business', 'artist', 'professional'];
      for (const type of validTypes) {
        expect(validateFormDataStructure({ entityType: type })).toBe(true);
      }
    });
  });
});
