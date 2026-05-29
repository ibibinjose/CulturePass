/**
 * useCalendarSync — web stub
 * --------------------------
 * Native implementation lives in useCalendarSync.native.ts (loaded by Metro
 * on iOS/Android). This file is the web/fallback version — no expo-calendar
 * dependency, device-calendar features are no-ops, but ICS file export works.
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { parseEventStartMs } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

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

const noop = async () => {};

export function useCalendarSync() {
  const queryClient = useQueryClient();

  const { data: prefs = DEFAULT_PREFS, isLoading } = useQuery({
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

  const exportEventToCalendar = useCallback(async (event: EventData): Promise<boolean> => {
    const ics = buildICS(event);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(event.title ?? 'event').replace(/[^a-z0-9]/gi, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }, []);

  const exportAllTickets = useCallback(async (events: EventData[]) => {
    for (const ev of events) {
      await exportEventToCalendar(ev);
    }
  }, [exportEventToCalendar]);

  const setShowPersonalEvents = async (val: boolean) => {
    await updateSettings({ showPersonalEvents: val });
  };

  const setAutoAddTickets = async (val: boolean) => {
    await updateSettings({ autoAddTickets: val });
  };

  const connectDeviceCalendar = async () => {
    if (Platform.OS === 'web') {
      await updateSettings({ deviceConnected: true });
    } else {
      // Native implementation would go here or in .native.ts
      await noop();
    }
  };

  const disconnectDeviceCalendar = async () => {
    if (Platform.OS === 'web') {
      await updateSettings({ deviceConnected: false });
    } else {
      await noop();
    }
  };

  const fetchPersonalEvents = noop as (startDate: Date, endDate: Date) => Promise<void>;

  return {
    prefs,
    isLoading,
    isSyncing,
    permissionGranted: false,
    personalEvents: [] as PersonalEvent[],
    connectDeviceCalendar,
    disconnectDeviceCalendar,
    fetchPersonalEvents,
    exportEventToCalendar,
    exportAllTickets,
    setShowPersonalEvents,
    setAutoAddTickets,
    isCalendarLinked: true, // Always true on web as it doesn't use the native module
  };
}

// ---------------------------------------------------------------------------
// Helpers (duplicated from native version — keep in sync if buildICS changes)
// ---------------------------------------------------------------------------

function parseEventDate(event: EventData): Date {
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

function buildICS(event: EventData): string {
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
