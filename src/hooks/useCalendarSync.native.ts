/**
 * useCalendarSync
 * ---------------
 * Manages device calendar integration for CulturePass.
 * - Requests calendar read/write permissions (expo-calendar)
 * - Reads personal device calendar events (shown as busy blocks)
 * - Exports CulturePass events to device calendar
 * - Persists sync preferences via Backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { parseEventStartMs } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

type ExpoCalendarNS = typeof import('expo-calendar');

/** Static import would crash the bundle if ExpoCalendar isn’t in the dev client — require inside try/catch. */
let ExpoCalendar: ExpoCalendarNS | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoCalendar = require('expo-calendar') as ExpoCalendarNS;
} catch {
  if (__DEV__) {
    console.warn(
      '[CulturePass] expo-calendar native module missing. Rebuild the app: npx expo run:ios (or run:android).'
    );
  }
}

const isCalendarLinked =
  ExpoCalendar != null && typeof ExpoCalendar.requestCalendarPermissions === 'function';

export interface PersonalEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  calendarName: string;
  color: string;
}

export interface CalendarSyncPrefs {
  deviceConnected: boolean;
  showPersonalEvents: boolean;
  autoAddTickets: boolean;
}

const DEFAULT_PREFS: CalendarSyncPrefs = {
  deviceConnected: false,
  showPersonalEvents: true,
  autoAddTickets: false,
};

export function useCalendarSync() {
  const queryClient = useQueryClient();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);

  const { data: prefs = DEFAULT_PREFS, isLoading: isPrefsLoading } = useQuery({
    queryKey: ['/api/calendar/settings'],
    queryFn: async () => {
      const settings = await api.calendar.getSettings();
      return {
        deviceConnected: settings.deviceConnected ?? DEFAULT_PREFS.deviceConnected,
        showPersonalEvents: settings.showPersonalEvents ?? DEFAULT_PREFS.showPersonalEvents,
        autoAddTickets: settings.autoAddTickets ?? DEFAULT_PREFS.autoAddTickets,
      };
    },
  });

  const { mutateAsync: updateSettings, isPending: isSyncing } = useMutation({
    mutationFn: (newPrefs: Partial<CalendarSyncPrefs>) => api.calendar.updateSettings(newPrefs),
    onSuccess: (updated) => {
      queryClient.setQueryData(['/api/calendar/settings'], updated);
    },
  });

  const showAlertNoNative = useCallback(() => {
    Alert.alert(
      'Calendar Module Missing',
      'The native Calendar module is not linked in this build. Please rebuild the dev client with npx expo run:ios.',
    );
  }, []);

  // Check permissions on mount
  useEffect(() => {
    if (Platform.OS !== 'web' && isCalendarLinked && ExpoCalendar) {
      ExpoCalendar.getCalendarPermissions()
        .then(({ granted }) => setPermissionGranted(granted))
        .catch(() => {/* ignore */});
    }
  }, []);

  /** Request read+write calendar permissions from the OS */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    if (!isCalendarLinked) {
      showAlertNoNative();
      return false;
    }
    const { granted } = await ExpoCalendar!.requestCalendarPermissions();
    setPermissionGranted(granted);
    if (!granted) {
      Alert.alert(
        'Calendar Permission Required',
        'To sync events with your calendar, please enable Calendar access in your device Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    }
    return granted;
  }, [showAlertNoNative]);

  /** Connect device calendar: request permission + persist status */
  const connectDeviceCalendar = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;
    await updateSettings({ deviceConnected: true });
  }, [requestPermission, updateSettings]);

  /** Disconnect device calendar */
  const disconnectDeviceCalendar = useCallback(async () => {
    await updateSettings({ deviceConnected: false });
    setPersonalEvents([]);
  }, [updateSettings]);

  /** Fetch personal calendar events for a date range */
  const fetchPersonalEvents = useCallback(async (startDate: Date, endDate: Date) => {
    if (Platform.OS === 'web' || !isCalendarLinked || !permissionGranted || !prefs.deviceConnected) return;
    try {
      const calendars = await ExpoCalendar!.getCalendars(ExpoCalendar!.EntityTypes.EVENT);
      const calendarIds = calendars.map((c) => c.id);
      if (!calendarIds.length) return;

      const raw = await ExpoCalendar!.listEvents(calendarIds, startDate, endDate);
      const mapped: PersonalEvent[] = raw.map((ev) => ({
        id: ev.id,
        title: ev.title ?? 'Busy',
        startDate: new Date(ev.startDate),
        endDate: new Date(ev.endDate),
        calendarName: calendars.find((c) => c.id === ev.calendarId)?.title ?? 'Calendar',
        color: calendars.find((c) => c.id === ev.calendarId)?.color ?? '#888',
      }));
      setPersonalEvents(mapped);
    } catch {
      // Permission revoked or unavailable — silently ignore
    }
  }, [permissionGranted, prefs.deviceConnected]);

  /** Export a single CulturePass event to the device calendar */
  const exportEventToCalendar = useCallback(async (event: EventData): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Web fallback: offer ICS download
      const ics = buildICS(event);
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(event.title ?? 'event').replace(/[^a-z0-9]/gi, '_')}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }
    if (!isCalendarLinked) {
      showAlertNoNative();
      return false;
    }

    const granted = permissionGranted || (await requestPermission());
    if (!granted) return false;

    try {
      const calendars = await ExpoCalendar!.getCalendars(ExpoCalendar!.EntityTypes.EVENT);
      // Prefer the default calendar
      const writable = calendars.find(
        (c) =>
          c.allowsModifications &&
          (c.source?.isLocalAccount || c.isPrimary),
      ) ?? calendars.find((c) => c.allowsModifications);

      if (!writable) {
        Alert.alert('No writable calendar found', 'Unable to add event to your calendar.');
        return false;
      }

      const startDate = parseEventDate(event);
      const endDate = parseEventEndDate(event, startDate);

      await writable.createEvent({
        title: event.title ?? 'CulturePass Event',
        notes: event.description ?? '',
        location: [event.venue, event.address, event.city].filter(Boolean).join(', '),
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -60 }], // 1h reminder
        url: `https://culturepass.app/e/${event.id}`,
      });

      Alert.alert('Added to Calendar', `"${event.title}" has been added to your calendar.`);
      return true;
    } catch {
      Alert.alert('Error', 'Could not add event to calendar. Please try again.');
      return false;
    }
  }, [permissionGranted, requestPermission, showAlertNoNative]);

  /** Bulk export all ticket events to device calendar */
  const exportAllTickets = useCallback(async (events: EventData[]) => {
    if (!events.length) return;
    let count = 0;
    for (const ev of events) {
      const ok = await exportEventToCalendar(ev);
      if (ok) count++;
    }
    if (count > 0) {
      Alert.alert('Sync Complete', `${count} event${count !== 1 ? 's' : ''} added to your calendar.`);
    }
  }, [exportEventToCalendar]);

  /** Toggle showPersonalEvents preference */
  const setShowPersonalEvents = useCallback(async (val: boolean) => {
    await updateSettings({ showPersonalEvents: val });
  }, [updateSettings]);

  /** Toggle autoAddTickets preference */
  const setAutoAddTickets = useCallback(async (val: boolean) => {
    await updateSettings({ autoAddTickets: val });
  }, [updateSettings]);

  return {
    prefs,
    isLoading: isPrefsLoading,
    isSyncing,
    permissionGranted,
    personalEvents,
    isCalendarLinked,
    connectDeviceCalendar,
    disconnectDeviceCalendar,
    fetchPersonalEvents,
    exportEventToCalendar,
    exportAllTickets,
    setShowPersonalEvents,
    setAutoAddTickets,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parseEventDate(event: EventData): Date {
  try {
    const raw: unknown = event.date;
    if (raw instanceof Date) return raw;
    if (typeof raw === 'string' && raw.length) {
      if (event.time) {
        const dateOnly = raw.includes('T') ? raw.split('T')[0] : raw;
        const startMs = parseEventStartMs(dateOnly, event.time);
        if (startMs != null) return new Date(startMs);
      }
      const clean = raw.includes('T') ? raw : `${raw}T00:00:00`;
      const d = new Date(clean);
      if (!isNaN(d.getTime())) return d;
    }
    // Firestore Timestamp
    if (raw && typeof raw === 'object' && 'toDate' in raw) {
      return (raw as { toDate: () => Date }).toDate();
    }
  } catch { /* fall through */ }
  return new Date();
}

function parseEventEndDate(event: EventData, start: Date): Date {
  const endSource = event.endDate ?? event.date;
  if (typeof endSource === 'string') {
    if (event.endTime) {
      const dateOnly = endSource.includes('T') ? endSource.split('T')[0] : endSource;
      const endMs = parseEventStartMs(dateOnly, event.endTime);
      if (endMs != null && endMs > start.getTime()) return new Date(endMs);
    }
    if (event.endDate) {
      const d = new Date(endSource.includes('T') ? endSource : `${endSource}T00:00:00`);
      if (!Number.isNaN(d.getTime()) && d > start) return d;
    }
  }
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

export function buildICS(event: EventData): string {
  const start = parseEventDate(event);
  const end = parseEventEndDate(event, start);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const location = [event.venue, event.address, event.city].filter(Boolean).join(', ');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//CulturePass//EN',
    'BEGIN:VEVENT',
    `UID:culturepass-${event.id}@culturepass.app`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${(event.title ?? 'CulturePass Event').replace(/\n/g, '\\n')}`,
    location ? `LOCATION:${location.replace(/\n/g, '\\n')}` : '',
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n').substring(0, 500)}` : '',
    `URL:https://culturepass.app/e/${event.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}
