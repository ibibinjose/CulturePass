import { NativeModules, Platform } from 'react-native';
import type { CultureWidgetSnapshotPayload } from './sync.types';

type AndroidWidgetModule = {
  /** Receives a JSON-serialised AndroidWidgetSnapshot */
  updateSnapshot: (json: string) => void;
};

/**
 * Structured snapshot sent to the Kotlin `CulturePassWidgetProvider`.
 * The provider reads `widgetType` to decide which RemoteViews layout to inflate.
 *
 * Android AppWidget size categories (reference):
 *   2×1 "small"   → show ticket / spotlight single-line
 *   2×2 "medium"  → show near-you list (up to 3 rows)
 *   4×2 "large"   → show identity card or rich event detail
 */
export type AndroidWidgetSnapshot = {
  /**
   * Determines which AppWidget layout is rendered:
   * - 'ticket'     → upcoming ticket card (eventTitle, date, venue, deeplink)
   * - 'near_you'   → nearby events list  (events[], locationLabel)
   * - 'identity'   → identity/QR card    (displayName, culturePassId, tier)
   * - 'membership' → membership/perks    (memberName, tier, renewalLabel, cashback)
   * - 'default'    → generic brand card  (primaryLine, secondaryLine)
   */
  widgetType: 'ticket' | 'near_you' | 'identity' | 'membership' | 'default';

  /** Generic fallback fields (all types should populate these) */
  primaryLine: string;
  secondaryLine: string;
  deeplink: string;

  /** ticket / near_you */
  events?: { title: string; startsAt: string; isFree: boolean }[];
  locationLabel?: string;

  /** ticket */
  venue?: string;
  ticketCode?: string;
  ticketStatus?: string;
  startsAtIso?: string;
  countdown?: string;

  /** identity */
  displayName?: string;
  culturePassId?: string;
  membershipTier?: string;

  /** membership */
  memberName?: string;
  tier?: string;
  renewalLabel?: string;
  cashbackBalance?: string;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatEventDate(date?: string, time?: string): string {
  if (!date) return '';
  const parsed = new Date(`${date}T${time?.trim().length ? time.trim() : '00:00'}:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function countdownLabel(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  const days = Math.floor((ms - Date.now()) / 86_400_000);
  if (days < 0) return undefined;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return undefined;
}

function formatMembershipExpiry(iso?: string): string | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return `Renews ${new Date(ms).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// ─── Snapshot builder ─────────────────────────────────────────────────────────

export function buildAndroidWidgetSnapshot(
  payload: CultureWidgetSnapshotPayload
): AndroidWidgetSnapshot {
  // ── Upcoming ticket ────────────────────────────────────────────────
  if (payload.upcomingTicket) {
    const { ticket, event, startsAt } = payload.upcomingTicket;
    const title = event?.title ?? ticket.eventTitle ?? ticket.eventName ?? 'Your ticket';
    const dateLabel = startsAt
      ? ((): string => {
          const ms = Date.parse(startsAt);
          return Number.isNaN(ms)
            ? ''
            : new Date(ms).toLocaleString('en-AU', {
                weekday: 'short', day: 'numeric', month: 'short',
                hour: 'numeric', minute: '2-digit',
              });
        })()
      : formatEventDate(event?.date ?? ticket.eventDate, event?.time ?? ticket.eventTime);

    return {
      widgetType: 'ticket',
      primaryLine: title,
      secondaryLine: dateLabel || 'Open for QR',
      deeplink: `culturepass://tickets/${ticket.id}`,
      venue: event?.venue ?? ticket.eventVenue ?? undefined,
      ticketCode: ticket.ticketCode ?? undefined,
      ticketStatus: ticket.status,
      startsAtIso: startsAt ?? undefined,
      countdown: countdownLabel(startsAt),
      events: [],
    };
  }

  // ── Nearby events ──────────────────────────────────────────────────
  const nearby = payload.nearby.slice(0, 3);
  if (nearby.length > 0) {
    return {
      widgetType: 'near_you',
      primaryLine: nearby[0].title,
      secondaryLine: formatEventDate(nearby[0].date, nearby[0].time),
      deeplink: 'culturepass://city',
      locationLabel: [payload.city, payload.country].filter(Boolean).join(', ') || 'Your area',
      events: nearby.map((e) => ({
        title: e.title,
        startsAt: formatEventDate(e.date, e.time),
        isFree: e.isFree ?? false,
      })),
    };
  }

  // ── Membership card ────────────────────────────────────────────────
  if (payload.membershipTier) {
    return {
      widgetType: 'membership',
      primaryLine: payload.membershipTier,
      secondaryLine: payload.displayName ?? 'CulturePass Member',
      deeplink: 'culturepass://membership',
      memberName: payload.displayName ?? 'Member',
      tier: payload.membershipTier,
      renewalLabel: formatMembershipExpiry(payload.membershipExpiry),
      cashbackBalance: payload.cashbackBalance,
    };
  }

  // ── Spotlight fallback ─────────────────────────────────────────────
  if (payload.spotlight) {
    return {
      widgetType: 'default',
      primaryLine: payload.spotlight.title,
      secondaryLine:
        [payload.city, payload.country].filter(Boolean).join(', ') || 'CulturePass',
      deeplink: 'culturepass://discover',
    };
  }

  // ── Brand default ──────────────────────────────────────────────────
  return {
    widgetType: 'default',
    primaryLine: 'CulturePass',
    secondaryLine: 'Explore events near you',
    deeplink: 'culturepass://',
  };
}

// ─── Native bridge ─────────────────────────────────────────────────────────────

export function syncAndroidHomeScreenWidget(payload: CultureWidgetSnapshotPayload): void {
  if (Platform.OS !== 'android') return;
  const mod = NativeModules.CulturePassWidgetModule as AndroidWidgetModule | undefined;
  if (!mod?.updateSnapshot) {
    if (__DEV__) {
      console.warn('[widgets] CulturePassWidgetModule not linked — rebuild the Android app.');
    }
    return;
  }
  try {
    mod.updateSnapshot(JSON.stringify(buildAndroidWidgetSnapshot(payload)));
  } catch (e) {
    if (__DEV__) console.warn('[widgets] Android widget sync failed:', e);
  }
}
