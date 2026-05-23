import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { LiveActivity, LiveActivityFactory, Widget } from 'expo-widgets';

import type { CultureLiveEventTrackerProps } from './CultureLiveEventTracker';

// ─── Payload types ────────────────────────────────────────────────────────────

type SpotlightPayload = {
  title: string;
  subtitle?: string;
  city?: string;
  startsAt?: string;
  category?: string;
};

type NearYouPayload = {
  locationLabel: string;
  events: { title: string; startsAt: string; isFree?: boolean }[];
};

type IdentityPayload = {
  displayName: string;
  culturePassId: string;
  membershipTier?: string;
};

type UpcomingTicketPayload = {
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  venue: string;
  ticketCode?: string;
  status: string;
  startsAtIso?: string;
};

type WatchGlancePayload = {
  line1: string;
  line2?: string;
  deepLink?: string;
};

type MembershipPayload = {
  memberName: string;
  tier: string;
  renewalLabel?: string;
  cashbackBalance?: string;
};

// ─── Platform guards ──────────────────────────────────────────────────────────

function isWidgetsModuleAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    // Only require expo-widgets if we are on iOS to avoid crashes on Android/Web
    // if the module tries to initialize itself on import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isWidgetsAPIAvailable } = require('expo-widgets');
    return !!isWidgetsAPIAvailable && isWidgetsAPIAvailable();
  } catch {
    return false;
  }
}

function shouldLoadNativeWidgets(): boolean {
  if (Platform.OS === 'web') return false;
  // expo-widgets uses @expo/ui/swift-ui which requires the iOS native module.
  if (Platform.OS !== 'ios') return false;
  // Expo Go / storeClient does not bundle the widget extension target.
  if (Constants.executionEnvironment === 'storeClient') return false;

  return isWidgetsModuleAvailable();
}

// ─── No-op stubs ──────────────────────────────────────────────────────────────

function noopWidget<T extends object>(): Widget<T> {
  return {
    reload: () => {},
    updateTimeline: () => {},
    updateSnapshot: () => {},
    getTimeline: async () => [],
  } as unknown as Widget<T>;
}

function noopLiveActivityFactory<T extends object>(): LiveActivityFactory<T> {
  const noopInstance = {
    update: async () => {},
    end: async () => {},
    getPushToken: async () => null as string | null,
    addPushTokenListener: () => ({ remove: () => {} }),
  } as unknown as LiveActivity<T>;
  return {
    start: () => noopInstance,
    getInstances: () => [],
  } as unknown as LiveActivityFactory<T>;
}

// ─── Loader helpers ───────────────────────────────────────────────────────────

function loadWidget<T extends object>(loader: () => Widget<T>, label: string): Widget<T> {
  if (!shouldLoadNativeWidgets()) return noopWidget<T>();
  try {
    return loader();
  } catch (error) {
    if (__DEV__) console.warn(`[widgets] ${label} unavailable:`, error);
    return noopWidget<T>();
  }
}

function loadLiveActivityFactory(): LiveActivityFactory<CultureLiveEventTrackerProps> {
  if (!shouldLoadNativeWidgets()) return noopLiveActivityFactory<CultureLiveEventTrackerProps>();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./CultureLiveEventTracker') as {
      default: LiveActivityFactory<CultureLiveEventTrackerProps>;
    };
    return mod.default;
  } catch (error) {
    if (__DEV__) console.warn('[widgets] Live Activity factory unavailable:', error);
    return noopLiveActivityFactory<CultureLiveEventTrackerProps>();
  }
}

// ─── Widget instances ─────────────────────────────────────────────────────────

export const CultureSpotlightWidget = loadWidget<SpotlightPayload>(
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./CultureSpotlightWidget') as { default: Widget<SpotlightPayload> }).default,
  'Spotlight'
);

export const CultureNearYouWidget = loadWidget<NearYouPayload>(
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./CultureNearYouWidget') as { default: Widget<NearYouPayload> }).default,
  'NearYou'
);

export const CultureIdentityQRWidget = loadWidget<IdentityPayload>(
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./CultureIdentityQRWidget') as { default: Widget<IdentityPayload> }).default,
  'Identity'
);

export const CultureUpcomingTicketWidget = loadWidget<UpcomingTicketPayload>(
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./CultureUpcomingTicketWidget') as { default: Widget<UpcomingTicketPayload> }).default,
  'UpcomingTicket'
);

export const CulturePassWatchWidget = loadWidget<WatchGlancePayload>(
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./CulturePassWatchWidget') as { default: Widget<WatchGlancePayload> }).default,
  'WatchGlance'
);

export const CultureMembershipWidget = loadWidget<MembershipPayload>(
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./CultureMembershipWidget') as { default: Widget<MembershipPayload> }).default,
  'Membership'
);

export const CultureLiveEventTracker = loadLiveActivityFactory();
