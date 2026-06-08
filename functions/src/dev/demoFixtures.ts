/**
 * Canonical demo fixture IDs — seeded into Firestore via scripts/seed-demo-fixtures.ts.
 * Handlers may fall back to these only in local/emulator mode (never production shortcuts).
 */

export const DEMO_USER_VIKRAM_ID = 'demo-vikram-sharma';
export const DEMO_USER_AARAV_ID = 'demo-aarav-nair';
export const DEMO_PROFILE_DARLING_ID = 'demo-darling-culture-hub';
export const DEMO_EVENT_GATE_ID = 'demo-symphony-gate-checkin';
export const DEMO_ORGANIZER_SEED_ID = 'demo-gate-organizer';

export const DEMO_CPID_VIKRAM = 'CP-U58B35B';
export const DEMO_CPID_AARAV = 'CP-AARAV01';
export const DEMO_CPID_DARLING = 'CP-DARLING01';

/** Real ticket QR codes (Firestore tickets collection, field qrCode) */
export const DEMO_TICKET_QR_VALID = 'CP-T-DEMO01';
export const DEMO_TICKET_QR_USED = 'CP-T-DEMO02';
export const DEMO_TICKET_QR_CANCELLED = 'CP-T-DEMO03';

/** Legacy mock-* scanner codes — emulator / no-Firestore only */
export const LEGACY_MOCK_TICKET_PREFIX = 'mock-';

export function allowScannerMockCodes(): boolean {
  return (
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    process.env.ALLOW_SCANNER_MOCKS === 'true' ||
    process.env.NODE_ENV === 'test'
  );
}

export function allowInlineDemoFallback(): boolean {
  return process.env.FUNCTIONS_EMULATOR === 'true' || process.env.ALLOW_DEMO_FIXTURES === 'true';
}

export const DEMO_USER_VIKRAM = {
  id: DEMO_USER_VIKRAM_ID,
  displayName: 'Vikram Sharma',
  username: 'vikramsharma',
  email: 'vikram@sharma.in',
  phone: '+61 491 570 888',
  city: 'Sydney',
  state: 'NSW',
  country: 'Australia',
  bio: 'Founder of CulturePassion. Passionate about bringing world cultures together through technology and community.',
  culturePassId: DEMO_CPID_VIKRAM,
  membership: { tier: 'premium' },
  avatarUrl: null as string | null,
  website: 'https://culturepassion.org',
  role: 'organizer',
};

export const DEMO_USER_AARAV = {
  id: DEMO_USER_AARAV_ID,
  displayName: 'Aarav Nair',
  username: 'aaravnair',
  email: 'aarav.nair@culturepass.app',
  phone: '+61 491 570 156',
  city: 'Sydney',
  state: 'NSW',
  country: 'Australia',
  bio: 'Cultural curator and community organizer. Building connection in Sydney.',
  culturePassId: DEMO_CPID_AARAV,
  membership: { tier: 'premium' },
  avatarUrl: null as string | null,
  role: 'user',
};

export const DEMO_PROFILE_DARLING = {
  id: DEMO_PROFILE_DARLING_ID,
  name: 'Darling Harbour Culture Hub',
  handle: 'darlingculture',
  entityType: 'business',
  cpid: DEMO_CPID_DARLING,
  imageUrl: null as string | null,
  avatarUrl: null as string | null,
  city: 'Sydney',
  state: 'NSW',
  country: 'Australia',
  description:
    'A vibrant hub for cultural expression, music, and community connection at Darling Harbour.',
  ownerId: DEMO_ORGANIZER_SEED_ID,
  email: 'events@darlingculture.org.au',
  phone: '+61 2 9240 8500',
  website: 'https://darlingculture.org.au',
  status: 'published',
};

export const DEMO_GATE_EVENT = {
  id: DEMO_EVENT_GATE_ID,
  title: 'Symphony Under the Stars',
  date: 'Friday, 12 Dec 2026',
  time: '7:30 PM',
  city: 'Sydney',
  country: 'Australia',
  venue: 'Sydney Opera House',
  organizerId: DEMO_ORGANIZER_SEED_ID,
  createdBy: DEMO_ORGANIZER_SEED_ID,
  status: 'published',
};

/** Legacy handler IDs kept for emulator/E2E backward compatibility */
const LEGACY_MOCK_USER_VIKRAM_ID = 'mock-user-id-58b35b';
const LEGACY_MOCK_USER_AARAV_ID = 'mock-user-id';
const LEGACY_MOCK_PROFILE_ID = 'mock-business-profile-id';

export function resolveCpidDemoLookup(
  cpid: string,
): { entityType: 'user' | 'profile'; targetId: string } | null {
  const upper = cpid.toUpperCase();
  if (upper === DEMO_CPID_VIKRAM) return { entityType: 'user', targetId: DEMO_USER_VIKRAM_ID };
  if (upper === DEMO_CPID_AARAV) return { entityType: 'user', targetId: DEMO_USER_AARAV_ID };
  if (upper === DEMO_CPID_DARLING || upper === 'CP-MOCKBIZ') {
    return { entityType: 'profile', targetId: DEMO_PROFILE_DARLING_ID };
  }
  return null;
}

export function resolveDemoUserById(id: string) {
  if (id === DEMO_USER_VIKRAM_ID || id === LEGACY_MOCK_USER_VIKRAM_ID) return DEMO_USER_VIKRAM;
  if (id === DEMO_USER_AARAV_ID || id === LEGACY_MOCK_USER_AARAV_ID) return DEMO_USER_AARAV;
  return null;
}

export function resolveDemoProfileById(id: string) {
  if (id === DEMO_PROFILE_DARLING_ID || id === LEGACY_MOCK_PROFILE_ID) return DEMO_PROFILE_DARLING;
  return null;
}

/** Emulator-only mock-* ticket scan responses (see allowScannerMockCodes). */
export function legacyMockTicketScanResponse(qrCode: string, qrLower: string) {
  const event = DEMO_GATE_EVENT;
  if (qrLower.startsWith('mock-used')) {
    return {
      valid: false,
      outcome: 'duplicate' as const,
      message: 'Ticket has already been scanned',
      ticket: {
        id: 'demo-ticket-used',
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.venue,
        tierName: 'General Admission',
        ticketCode: qrCode,
        status: 'used',
      },
    };
  }
  if (qrLower.startsWith('mock-invalid')) {
    return {
      valid: false,
      outcome: 'rejected' as const,
      message: 'Invalid ticket code',
    };
  }
  if (qrLower.startsWith('mock-cancelled')) {
    return {
      valid: false,
      outcome: 'rejected' as const,
      message: 'Ticket has been cancelled',
      ticket: {
        id: 'demo-ticket-cancelled',
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.venue,
        tierName: 'VIP Lounge',
        ticketCode: qrCode,
        status: 'cancelled',
      },
    };
  }
  if (qrLower.startsWith(LEGACY_MOCK_TICKET_PREFIX)) {
    return {
      valid: true,
      outcome: 'accepted' as const,
      message: 'Mock ticket scanned successfully',
      ticket: {
        id: 'demo-ticket-valid',
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.venue,
        tierName: 'VIP Lounge',
        ticketCode: qrCode,
        status: 'confirmed',
      },
    };
  }
  return null;
}