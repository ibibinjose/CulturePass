/**
 * DeepLinkResolver Tests
 *
 * Tests for deep link resolution, validation, auth gate persistence,
 * and Open Graph meta generation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { deepLinkResolver } from '../deep-link-resolver';
import type { OGMeta } from '../deep-link-resolver';
import { api } from '../api';

// Mock the api module (AsyncStorage is mocked globally via jest.setup.js)
jest.mock('../api', () => ({
  api: {
    raw: jest.fn(),
    baseUrl: jest.fn(() => 'https://api.culturepass.co'),
  },
}));

const mockApiRaw = api.raw as jest.MockedFunction<typeof api.raw>;

// ---------------------------------------------------------------------------
// Prefix & ID Validation
// ---------------------------------------------------------------------------

describe('deepLinkResolver.isValidPrefix', () => {
  it('returns true for all valid prefixes', () => {
    const validPrefixes = ['e', 'c', 'b', 'v', 'u', 'o', 't'];
    validPrefixes.forEach((prefix) => {
      expect(deepLinkResolver.isValidPrefix(prefix)).toBe(true);
    });
  });

  it('returns false for invalid prefixes', () => {
    const invalidPrefixes = ['x', 'z', 'event', '', ' ', '1', 'E'];
    invalidPrefixes.forEach((prefix) => {
      expect(deepLinkResolver.isValidPrefix(prefix)).toBe(false);
    });
  });
});

describe('deepLinkResolver.isValidId', () => {
  it('returns true for valid alphanumeric IDs', () => {
    expect(deepLinkResolver.isValidId('abc123')).toBe(true);
    expect(deepLinkResolver.isValidId('event-id-123')).toBe(true);
    expect(deepLinkResolver.isValidId('event_id_123')).toBe(true);
    expect(deepLinkResolver.isValidId('A')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(deepLinkResolver.isValidId('')).toBe(false);
  });

  it('returns false for IDs with invalid characters', () => {
    expect(deepLinkResolver.isValidId('id with spaces')).toBe(false);
    expect(deepLinkResolver.isValidId('id/with/slashes')).toBe(false);
    expect(deepLinkResolver.isValidId('id@special')).toBe(false);
    expect(deepLinkResolver.isValidId('id.with.dots')).toBe(false);
  });

  it('returns false for IDs exceeding max length', () => {
    const longId = 'a'.repeat(129);
    expect(deepLinkResolver.isValidId(longId)).toBe(false);
  });

  it('returns true for IDs at max length', () => {
    const maxId = 'a'.repeat(128);
    expect(deepLinkResolver.isValidId(maxId)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolve()
// ---------------------------------------------------------------------------

describe('deepLinkResolver.resolve', () => {
  beforeEach(async () => {
    mockApiRaw.mockReset();
    await AsyncStorage.clear();
  });

  it('returns not_found for invalid prefix', async () => {
    const result = await deepLinkResolver.resolve('x', 'abc123');
    expect(result.status).toBe('not_found');
    expect(mockApiRaw).not.toHaveBeenCalled();
  });

  it('returns not_found for malformed ID (empty)', async () => {
    const result = await deepLinkResolver.resolve('e', '');
    expect(result.status).toBe('not_found');
    expect(mockApiRaw).not.toHaveBeenCalled();
  });

  it('returns not_found for malformed ID (invalid chars)', async () => {
    const result = await deepLinkResolver.resolve('e', 'id with spaces');
    expect(result.status).toBe('not_found');
    expect(mockApiRaw).not.toHaveBeenCalled();
  });

  it('returns not_found for malformed ID (too long)', async () => {
    const result = await deepLinkResolver.resolve('e', 'a'.repeat(200));
    expect(result.status).toBe('not_found');
    expect(mockApiRaw).not.toHaveBeenCalled();
  });

  it('returns resolved when entity exists', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: true,
      entity: {
        id: 'event-123',
        title: 'Sydney Music Festival',
        imageUrl: 'https://img.example.com/event.jpg',
        city: 'Sydney',
        description: 'A great music festival',
      },
    });

    const result = await deepLinkResolver.resolve('e', 'event-123');
    expect(result.status).toBe('resolved');
    expect(result.targetRoute).toBe('/event/event-123');
    expect(result.ogMeta).toBeDefined();
    expect(result.ogMeta?.title).toBe('Sydney Music Festival');
  });

  it('returns auth_required when backend indicates auth needed', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: false,
      authRequired: true,
    });

    const result = await deepLinkResolver.resolve('e', 'event-123');
    expect(result.status).toBe('auth_required');
    expect(result.targetRoute).toBe('/event/event-123');
    // Verify destination was persisted via setItem call
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@cp_dl_dest',
      '/event/event-123'
    );
  });

  it('returns fallback with entities when entity deleted but similar exist', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: false,
      fallbackEntities: [
        { id: 'e1', title: 'Event 1', city: 'Sydney', createdAt: '2026-01-01' },
        { id: 'e2', title: 'Event 2', city: 'Sydney', createdAt: '2026-01-02' },
        { id: 'e3', title: 'Event 3', city: 'Sydney', createdAt: '2026-01-03' },
      ],
    });

    const result = await deepLinkResolver.resolve('e', 'deleted-event');
    expect(result.status).toBe('fallback');
    expect(result.fallbackEntities).toHaveLength(3);
    expect(result.fallbackEntities?.[0].type).toBe('event');
    expect(result.fallbackEntities?.[0].title).toBe('Event 1');
  });

  it('limits fallback entities to 5', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: false,
      fallbackEntities: Array.from({ length: 10 }, (_, i) => ({
        id: `e${i}`,
        title: `Event ${i}`,
        city: 'Sydney',
      })),
    });

    const result = await deepLinkResolver.resolve('e', 'deleted-event');
    expect(result.status).toBe('fallback');
    expect(result.fallbackEntities).toHaveLength(5);
  });

  it('returns not_found when no fallback entities available', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: false,
      fallbackEntities: [],
    });

    const result = await deepLinkResolver.resolve('e', 'deleted-event');
    expect(result.status).toBe('not_found');
  });

  it('returns not_found on network error', async () => {
    mockApiRaw.mockRejectedValueOnce(new Error('Network error'));

    const result = await deepLinkResolver.resolve('e', 'event-123');
    expect(result.status).toBe('not_found');
  });

  it('resolves community prefix correctly', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: true,
      entity: { id: 'comm-1', name: 'Indian Community Sydney' },
    });

    const result = await deepLinkResolver.resolve('c', 'comm-1');
    expect(result.status).toBe('resolved');
    expect(result.targetRoute).toBe('/community/comm-1');
  });

  it('resolves business prefix correctly', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: true,
      entity: { id: 'biz-1', title: 'Spice Kitchen' },
    });

    const result = await deepLinkResolver.resolve('b', 'biz-1');
    expect(result.status).toBe('resolved');
    expect(result.targetRoute).toBe('/business/biz-1');
  });

  it('resolves venue prefix correctly', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: true,
      entity: { id: 'venue-1', title: 'Sydney Opera House' },
    });

    const result = await deepLinkResolver.resolve('v', 'venue-1');
    expect(result.status).toBe('resolved');
    expect(result.targetRoute).toBe('/venue/venue-1');
  });

  it('resolves user prefix correctly', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: true,
      entity: { id: 'user-1', displayName: 'John Doe' },
    });

    const result = await deepLinkResolver.resolve('u', 'user-1');
    expect(result.status).toBe('resolved');
    expect(result.targetRoute).toBe('/user/user-1');
  });

  it('resolves organisation prefix correctly', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: true,
      entity: { id: 'org-1', name: 'Cultural Arts Foundation' },
    });

    const result = await deepLinkResolver.resolve('o', 'org-1');
    expect(result.status).toBe('resolved');
    expect(result.targetRoute).toBe('/organiser/org-1');
  });

  it('resolves ticket prefix correctly', async () => {
    mockApiRaw.mockResolvedValueOnce({
      exists: true,
      entity: { id: 'ticket-1', title: 'VIP Pass' },
    });

    const result = await deepLinkResolver.resolve('t', 'ticket-1');
    expect(result.status).toBe('resolved');
    expect(result.targetRoute).toBe('/tickets/ticket-1');
  });
});

// ---------------------------------------------------------------------------
// Auth Gate Destination Persistence
// ---------------------------------------------------------------------------

describe('deepLinkResolver.persistDestination', () => {
  it('calls AsyncStorage.setItem with correct key and value', async () => {
    (AsyncStorage.setItem as jest.Mock).mockClear();
    await deepLinkResolver.persistDestination('/event/abc123');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@cp_dl_dest',
      '/event/abc123'
    );
  });

  it('handles storage errors gracefully', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));
    // Should not throw
    await expect(
      deepLinkResolver.persistDestination('/event/abc123')
    ).resolves.toBeUndefined();
  });
});

describe('deepLinkResolver.getPersistedDestination', () => {
  it('retrieves persisted route from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('/event/abc123');
    const result = await deepLinkResolver.getPersistedDestination();
    expect(result).toBe('/event/abc123');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@cp_dl_dest');
  });

  it('returns null when no destination persisted', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const result = await deepLinkResolver.getPersistedDestination();
    expect(result).toBeNull();
  });

  it('returns null on storage error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
    const result = await deepLinkResolver.getPersistedDestination();
    expect(result).toBeNull();
  });
});

describe('deepLinkResolver.clearPersistedDestination', () => {
  it('calls AsyncStorage.removeItem with correct key', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    await deepLinkResolver.clearPersistedDestination();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@cp_dl_dest');
  });

  it('handles storage errors gracefully', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
    await expect(
      deepLinkResolver.clearPersistedDestination()
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateOGMeta()
// ---------------------------------------------------------------------------

describe('deepLinkResolver.generateOGMeta', () => {
  it('generates OG meta for event entity', () => {
    const entity = {
      title: 'Diwali Festival 2026',
      imageUrl: 'https://img.example.com/diwali.jpg',
      description: 'Celebrate Diwali with the community',
    };

    const meta: OGMeta = deepLinkResolver.generateOGMeta('e', entity);
    expect(meta.title).toBe('Diwali Festival 2026');
    expect(meta.image).toBe('https://img.example.com/diwali.jpg');
    expect(meta.description).toBe('Celebrate Diwali with the community');
  });

  it('uses name field when title is not available', () => {
    const entity = { name: 'Indian Community Sydney' };
    const meta = deepLinkResolver.generateOGMeta('c', entity);
    expect(meta.title).toBe('Indian Community Sydney');
  });

  it('uses displayName field for user entities', () => {
    const entity = { displayName: 'Jane Smith', avatarUrl: 'https://img.example.com/avatar.jpg' };
    const meta = deepLinkResolver.generateOGMeta('u', entity);
    expect(meta.title).toBe('Jane Smith');
    expect(meta.image).toBe('https://img.example.com/avatar.jpg');
  });

  it('uses heroImage when imageUrl is not available', () => {
    const entity = { title: 'Event', heroImage: 'https://img.example.com/hero.jpg' };
    const meta = deepLinkResolver.generateOGMeta('e', entity);
    expect(meta.image).toBe('https://img.example.com/hero.jpg');
  });

  it('falls back to default OG image when no image available', () => {
    const entity = { title: 'No Image Event' };
    const meta = deepLinkResolver.generateOGMeta('e', entity);
    expect(meta.image).toBe('https://culturepass.co/og-default.png');
  });

  it('falls back to default description when entity has none', () => {
    const entity = { title: 'Event Title' };
    const meta = deepLinkResolver.generateOGMeta('e', entity);
    expect(meta.description).toContain('CulturePass');
  });

  it('returns default meta for invalid prefix', () => {
    const entity = { title: 'Something' };
    const meta = deepLinkResolver.generateOGMeta('x', entity);
    expect(meta.title).toBe('CulturePass');
    expect(meta.description).toBe('Discover. Connect. Belong.');
  });

  it('handles null entity gracefully', () => {
    const meta = deepLinkResolver.generateOGMeta('e', null);
    expect(meta.title).toBe('CulturePass');
    expect(meta.image).toBe('https://culturepass.co/og-default.png');
  });

  it('generates correct meta for all valid prefixes', () => {
    const prefixes = ['e', 'c', 'b', 'v', 'u', 'o', 't'];
    const entity = { title: 'Test Entity', imageUrl: 'https://img.example.com/test.jpg' };

    prefixes.forEach((prefix) => {
      const meta = deepLinkResolver.generateOGMeta(prefix, entity);
      expect(meta.title).toBe('Test Entity');
      expect(meta.image).toBe('https://img.example.com/test.jpg');
      expect(meta.description.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// getEntityType() & getTargetRoute()
// ---------------------------------------------------------------------------

describe('deepLinkResolver.getEntityType', () => {
  it('returns correct entity type for each prefix', () => {
    expect(deepLinkResolver.getEntityType('e')).toBe('event');
    expect(deepLinkResolver.getEntityType('c')).toBe('community');
    expect(deepLinkResolver.getEntityType('b')).toBe('business');
    expect(deepLinkResolver.getEntityType('v')).toBe('venue');
    expect(deepLinkResolver.getEntityType('u')).toBe('user');
    expect(deepLinkResolver.getEntityType('o')).toBe('organisation');
    expect(deepLinkResolver.getEntityType('t')).toBe('ticket');
  });

  it('returns undefined for invalid prefix', () => {
    expect(deepLinkResolver.getEntityType('x')).toBeUndefined();
    expect(deepLinkResolver.getEntityType('')).toBeUndefined();
  });
});

describe('deepLinkResolver.getTargetRoute', () => {
  it('returns correct route for valid prefix and ID', () => {
    expect(deepLinkResolver.getTargetRoute('e', 'abc123')).toBe('/event/abc123');
    expect(deepLinkResolver.getTargetRoute('c', 'comm-1')).toBe('/community/comm-1');
    expect(deepLinkResolver.getTargetRoute('b', 'biz-1')).toBe('/business/biz-1');
    expect(deepLinkResolver.getTargetRoute('v', 'venue-1')).toBe('/venue/venue-1');
    expect(deepLinkResolver.getTargetRoute('u', 'user-1')).toBe('/user/user-1');
    expect(deepLinkResolver.getTargetRoute('o', 'org-1')).toBe('/organiser/org-1');
    expect(deepLinkResolver.getTargetRoute('t', 'ticket-1')).toBe('/tickets/ticket-1');
  });

  it('returns undefined for invalid prefix', () => {
    expect(deepLinkResolver.getTargetRoute('x', 'abc123')).toBeUndefined();
  });

  it('returns undefined for invalid ID', () => {
    expect(deepLinkResolver.getTargetRoute('e', '')).toBeUndefined();
    expect(deepLinkResolver.getTargetRoute('e', 'id with spaces')).toBeUndefined();
  });
});
