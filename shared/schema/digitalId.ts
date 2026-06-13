/** Consolidated Digital ID payload for /profile/qr — client + server contract. */

export interface DigitalIdAffiliation {
  id: string;
  name: string;
  avatarUrl?: string | null;
  entityType?: string | null;
}

export interface DigitalIdUpcomingTicket {
  id: string;
  eventTitle?: string;
  eventName?: string;
  eventDate?: string;
  date?: string;
  eventVenue?: string;
  ticketCode?: string;
  qrCode?: string;
}

export interface DigitalIdWalletReadiness {
  apple: boolean;
  google: boolean;
  mockCredentials?: boolean;
  publicOrigin: string;
}

export interface DigitalIdBrand {
  name: string;
  domain: string;
  domainDisplay: string;
  tagline: string;
}

export interface DigitalIdSummary {
  userId: string;
  cpid: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  avatarUpdatedAt?: string | null;
  updatedAt?: string | null;
  memberSince: string;
  tier: string;
  tierLabel: string;
  profileUrl: string;
  qrPayload: string;
  eventQrPayload: string;
  isVerified?: boolean;
  affiliation?: DigitalIdAffiliation | null;
  location?: string;
  interests: string[];
  upcomingTicket?: DigitalIdUpcomingTicket | null;
  wallet: DigitalIdWalletReadiness;
  brand: DigitalIdBrand;
}