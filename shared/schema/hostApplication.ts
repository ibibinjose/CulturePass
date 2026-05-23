/**
 * Host Application — submitted by users who want to become organisers / hosts
 * on CulturePass. Reviewed by the team; approval upgrades the user's role to
 * 'organizer' and unlocks the Hostspace creation lab.
 */

export type HostType =
  | 'creator'       // Individual artist / content creator
  | 'business'      // Cultural business or brand
  | 'organizer'     // Event organizer / producer
  | 'venue'         // Venue or cultural space
  | 'community';    // Community leader / association

export type HostApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface HostApplication {
  id: string;
  userId: string;

  // ── What kind of host ──────────────────────────────────────────────────────
  hostType: HostType;
  /** Full name of the applicant */
  fullName: string;
  /** Business / organisation / stage name (optional) */
  businessName?: string | null;
  /** One-paragraph description of what they do */
  description: string;

  // ── Location ───────────────────────────────────────────────────────────────
  city?: string | null;
  country?: string | null;

  // ── Links (optional) ──────────────────────────────────────────────────────
  websiteUrl?: string | null;
  instagramHandle?: string | null;

  // ── Motivation ─────────────────────────────────────────────────────────────
  /** Why they want to list on CulturePass */
  motivation?: string | null;

  // ── Review ─────────────────────────────────────────────────────────────────
  status: HostApplicationStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;

  createdAt: string;
  updatedAt: string;
}

export const HOST_TYPE_OPTIONS: {
  id: HostType;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    id: 'creator',
    label: 'Individual Creator',
    desc: 'Artist, performer, musician, or cultural content creator.',
    icon: 'mic-outline',
  },
  {
    id: 'business',
    label: 'Business / Brand',
    desc: 'Cultural shop, restaurant, service provider, or brand.',
    icon: 'briefcase-outline',
  },
  {
    id: 'organizer',
    label: 'Event Organizer',
    desc: 'Producer of festivals, concerts, community events, or cultural experiences.',
    icon: 'calendar-outline',
  },
  {
    id: 'venue',
    label: 'Venue Owner',
    desc: 'Cultural hall, gallery, club, studio, or event space.',
    icon: 'location-outline',
  },
  {
    id: 'community',
    label: 'Community Leader',
    desc: 'Diaspora group, cultural association, or community organisation.',
    icon: 'people-outline',
  },
];
