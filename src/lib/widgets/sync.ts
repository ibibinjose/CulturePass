import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { CultureLiveEventTrackerProps } from '@/widgets/CultureLiveEventTracker';
import type { Ticket } from '@/shared/schema';
import { syncAndroidHomeScreenWidget } from './androidWidget';
import type { CultureWidgetSnapshotPayload } from './sync.types';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatEventDate(date?: string, time?: string): string {
  if (!date) return 'Date TBA';
  const parsed = new Date(`${date}T${time?.trim().length ? time.trim() : '00:00'}:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatLiveActivityTime(startsAtIso: string | null): string | undefined {
  if (!startsAtIso) return undefined;
  const ms = Date.parse(startsAtIso);
  if (Number.isNaN(ms)) return startsAtIso;
  return new Date(ms).toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMembershipExpiry(iso?: string): string | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return `Renews ${new Date(ms).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// ─── Live Activity ─────────────────────────────────────────────────────────────

function liveActivityStatus(ticket: Ticket, startsAtMs: number): CultureLiveEventTrackerProps['status'] {
  if (ticket.status === 'used' || ticket.checkedIn) return 'checked_in';
  const now = Date.now();
  if (now > startsAtMs + 6 * 60 * 60 * 1000) return 'finished';
  if (now >= startsAtMs - 90 * 60 * 1000 && now < startsAtMs + 4 * 60 * 60 * 1000) return 'doors_open';
  return 'upcoming';
}

function scheduleLiveActivitySync(
  payload: CultureWidgetSnapshotPayload,
  widgets: typeof import('@/widgets')
): void {
  if (Platform.OS !== 'ios') return;

  void (async () => {
    try {
      const factory = widgets.CultureLiveEventTracker;
      if (!payload.upcomingTicket) {
        for (const instance of factory.getInstances()) await instance.end('immediate');
        return;
      }

      const { ticket, event, startsAt } = payload.upcomingTicket;
      const startMs = startsAt ? Date.parse(startsAt) : Number.NaN;
      if (!Number.isFinite(startMs)) return;

      const props: CultureLiveEventTrackerProps = {
        eventTitle: event?.title ?? ticket.eventTitle ?? ticket.eventName ?? 'CulturePass event',
        venue: event?.venue ?? ticket.eventVenue ?? 'Venue TBA',
        startsAt: formatLiveActivityTime(startsAt),
        status: liveActivityStatus(ticket, startMs),
      };

      const instances = factory.getInstances();
      if (instances.length > 0) {
        await instances[0].update(props);
        return;
      }

      const msUntilStart = startMs - Date.now();
      if (msUntilStart > 0 && msUntilStart <= 48 * 60 * 60 * 1000) {
        factory.start(props, `culturepass://tickets/${ticket.id}`);
      }
    } catch (error) {
      if (__DEV__) console.warn('[widgets] Live Activity sync failed:', error);
    }
  })();
}

// ─── Main sync ────────────────────────────────────────────────────────────────

export function syncCultureWidgetSnapshots(payload: CultureWidgetSnapshotPayload): void {
  if (Platform.OS === 'web') return;
  if (Constants.executionEnvironment === 'storeClient') return;

  if (Platform.OS === 'android') {
    syncAndroidHomeScreenWidget(payload);
    return;
  }

  let widgets: typeof import('@/widgets');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    widgets = require('@/widgets') as typeof import('@/widgets');
  } catch (error) {
    if (__DEV__) console.warn('[widgets] Snapshot sync skipped; widget module unavailable:', error);
    return;
  }

  // ── Spotlight ─────────────────────────────────────────────────────
  widgets.CultureSpotlightWidget.updateSnapshot({
    title: payload.spotlight?.title ?? 'CulturePass Spotlight',
    subtitle: payload.spotlight?.description ?? 'Featured cultural event',
    city: payload.spotlight?.city ?? payload.city,
    startsAt: payload.nearby[0]
      ? formatEventDate(payload.nearby[0].date, payload.nearby[0].time)
      : undefined,
    category: (payload.spotlight as { category?: string } | null)?.category,
  });

  // ── Near You ──────────────────────────────────────────────────────
  widgets.CultureNearYouWidget.updateSnapshot({
    locationLabel: [payload.city, payload.country].filter(Boolean).join(', ') || 'Your area',
    events: payload.nearby.slice(0, 3).map((e) => ({
      title: e.title,
      startsAt: formatEventDate(e.date, e.time),
      isFree: e.isFree,
    })),
  });

  // ── Identity QR ───────────────────────────────────────────────────
  widgets.CultureIdentityQRWidget.updateSnapshot({
    displayName: payload.displayName ?? 'CulturePass Member',
    culturePassId:
      payload.culturePassId ??
      payload.upcomingTicket?.ticket.cpTicketId ??
      payload.upcomingTicket?.ticket.id ??
      'CP-ID',
    membershipTier: payload.membershipTier,
  });

  // ── Upcoming Ticket ───────────────────────────────────────────────
  if (payload.upcomingTicket) {
    const { ticket, event: ev, startsAt } = payload.upcomingTicket;
    const fallbackDate = startsAt
      ? formatEventDate(startsAt.split('T')[0], startsAt.split('T')[1]?.slice(0, 5))
      : 'Date TBA';

    widgets.CultureUpcomingTicketWidget.updateSnapshot({
      eventTitle: ev?.title ?? ticket.eventTitle ?? ticket.eventName ?? 'Upcoming event',
      eventDate: ev?.date ?? ticket.eventDate ?? ticket.date ?? fallbackDate,
      eventTime: ev?.time ?? ticket.eventTime ?? undefined,
      venue: ev?.venue ?? ticket.eventVenue ?? 'Venue TBA',
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      startsAtIso: startsAt ?? undefined,
    });
  } else {
    widgets.CultureUpcomingTicketWidget.updateSnapshot({
      eventTitle: 'No upcoming tickets',
      eventDate: 'Book in CulturePass',
      venue: '',
      status: 'none',
    });
  }

  // ── Watch Glance ──────────────────────────────────────────────────
  const watchLine1 = payload.upcomingTicket
    ? (payload.upcomingTicket.event?.title ??
       payload.upcomingTicket.ticket.eventTitle ??
       payload.upcomingTicket.ticket.eventName ??
       'Next ticket')
    : (payload.nearby[0]?.title ?? payload.spotlight?.title ?? 'CulturePass');

  const watchLine2 = payload.upcomingTicket
    ? (formatLiveActivityTime(payload.upcomingTicket.startsAt) ??
       formatEventDate(
         payload.upcomingTicket.event?.date ?? payload.upcomingTicket.ticket.eventDate,
         payload.upcomingTicket.event?.time ?? payload.upcomingTicket.ticket.eventTime
       ))
    : payload.nearby[0]
      ? formatEventDate(payload.nearby[0].date, payload.nearby[0].time)
      : [payload.city, payload.country].filter(Boolean).join(', ') || undefined;

  widgets.CulturePassWatchWidget.updateSnapshot({
    line1: watchLine1,
    line2: watchLine2,
    deepLink: payload.upcomingTicket
      ? `culturepass://tickets/${payload.upcomingTicket.ticket.id}`
      : 'culturepass://city',
  });

  // ── Membership ────────────────────────────────────────────────────
  if (payload.membershipTier) {
    widgets.CultureMembershipWidget.updateSnapshot({
      memberName: payload.displayName ?? 'CulturePass Member',
      tier: payload.membershipTier,
      renewalLabel: formatMembershipExpiry(payload.membershipExpiry),
      cashbackBalance: payload.cashbackBalance,
    });
  }

  // ── Live Activity (iOS only) ──────────────────────────────────────
  scheduleLiveActivitySync(payload, widgets);
}
