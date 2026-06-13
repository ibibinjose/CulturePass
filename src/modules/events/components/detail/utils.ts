import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { routeWithRedirect } from '@/lib/routes';
import type { EventData } from '@/shared/schema';
import type { Profile } from '@/shared/schema/profile';
import {
  DISPLAY_FALLBACK,
  isOrganiserIdPlaceholder,
  sanitizeOrganiserDisplayName,
} from '@/lib/presentation';

export const isWeb = Platform.OS === 'web';

export function safeIcsFilenameBase(title: string): string {
  const t = title.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').trim();
  return (t || 'culturepass-event').slice(0, 80);
}

export function promptRsvpLogin(redirectPath: string) {
  if (isWeb && typeof window !== 'undefined') {
    if (window.confirm('Please sign in to RSVP.\n\nOpen sign in?')) {
      router.push(routeWithRedirect('/(onboarding)/login', redirectPath));
    }
    return;
  }
  Alert.alert('Login required', 'Please sign in to RSVP.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', redirectPath)) },
  ]);
}

export function confirmRemoveRsvp(onRemove: () => void) {
  if (isWeb && typeof window !== 'undefined') {
    if (window.confirm('Remove yourself from the guest list?')) onRemove();
    return;
  }
  Alert.alert('Remove RSVP?', 'You will no longer appear as going to this event.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: onRemove },
  ]);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function cityToCoordinates(city?: string): { latitude: number; longitude: number } | null {
  if (!city) return null;
  const match = getPostcodesByPlace(city)[0];
  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude };
}

export function toCalendarDate(date: string, time?: string): Date | null {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  const dt = new Date(year, month - 1, day, 18, 0, 0, 0);
  const match = (time ?? '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    dt.setHours(hour, minute, 0, 0);
  }
  return dt;
}

export function toGoogleCalendarTimestamp(value: Date): string {
  const iso = value.toISOString();
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function toICSTimestamp(value: Date): string {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function startCaseLabel(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Minimal host row for event detail (avatar, name, website, verified, contact). */
export interface ResolvedEventOrganizer {
  name: string;
  avatarUrl?: string | null;
  website?: string | null;
  isVerified?: boolean;
  email?: string | null;
  phone?: string | null;
}

function isLoadedProfile(v: unknown): v is Pick<Profile, 'name'> & Partial<Profile> {
  return Boolean(v && typeof v === 'object' && typeof (v as Profile).name === 'string' && (v as Profile).name.trim());
}

/**
 * Prefer loaded publisher profile, then inline hostInfo / legacy host fields, then a safe label.
 * When `event` is defined, never returns null so detail UI can bind without null checks.
 */
export function resolveEventOrganizer(
  event?: unknown,
  publisherProfile?: unknown,
): ResolvedEventOrganizer | null {
  if (!event || typeof event !== 'object') return null;
  const ev = event as EventData;

  if (isLoadedProfile(publisherProfile)) {
    const p = publisherProfile;
    const website = p.socialLinks?.website?.trim() || null;
    const email = (p.contactEmail ?? p.email)?.trim() || null;
    const phone = p.phone?.trim() || null;
    return {
      name: p.name.trim(),
      avatarUrl: p.avatarUrl ?? p.imageUrl ?? null,
      website,
      isVerified: Boolean(p.isVerified),
      email,
      phone,
    };
  }

  const hi = ev.hostInfo;
  if (hi?.name?.trim()) {
    return {
      name: hi.name.trim(),
      avatarUrl: null,
      website: hi.websiteUrl?.trim() || null,
      isVerified: false,
      email: hi.contactEmail?.trim() || null,
      phone: hi.contactPhone?.trim() || null,
    };
  }

  if (ev.hostName?.trim()) {
    return {
      name: ev.hostName.trim(),
      avatarUrl: null,
      website: null,
      isVerified: false,
      email: ev.hostEmail?.trim() || null,
      phone: ev.hostPhone?.trim() || null,
    };
  }

  return {
    name: DISPLAY_FALLBACK.organisedBy,
    avatarUrl: null,
    website: null,
    isVerified: false,
    email: null,
    phone: null,
  };
}

export type ResolveOrganiserLabelOptions = {
  communityName?: string | null;
  profileLoading?: boolean;
};

/**
 * User-facing organiser label — never exposes raw uids; prefers profile & community names.
 */
export function resolveOrganiserLabel(
  event: EventData,
  publisherProfile?: unknown,
  options?: ResolveOrganiserLabelOptions,
): string {
  const profilePending = Boolean(options?.profileLoading);
  if (profilePending) {
    const interim = resolveEventOrganizer(event, publisherProfile)?.name?.trim();
    if (interim && !isOrganiserIdPlaceholder(interim)) {
      return sanitizeOrganiserDisplayName(interim);
    }
    return DISPLAY_FALLBACK.organiserLoading;
  }

  const resolvedName = resolveEventOrganizer(event, publisherProfile)?.name;
  const fromResolver = sanitizeOrganiserDisplayName(resolvedName);
  if (fromResolver !== DISPLAY_FALLBACK.organisedBy) return fromResolver;

  const community = options?.communityName?.trim();
  if (community) return community;

  return DISPLAY_FALLBACK.organisedBy;
}

export function buildICS(title: string, start: Date, end: Date, description: string, location: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//CulturePass//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toICSTimestamp(start)}`,
    `DTEND:${toICSTimestamp(end)}`,
    `SUMMARY:${title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}
