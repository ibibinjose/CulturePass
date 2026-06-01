/**
 * Shared navigation data: attendee journeys, host hub, and web sidebar links.
 * Import from Profile, Menu, WebSidebar, and Settings — single source of truth for routes/icons.
 */
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';

import {
  CREATE_LAB_PATHNAME,
  LISTING_WIZARD_PUBLIC_PATHNAME,
  createLabCategoryHref,
} from '@/constants/navigation/createNav';

export type IonIcon = keyof typeof Ionicons.glyphMap;

/** Canonical HostSpace Creation Lab URL (events, communities, listings entry). */
export const HOSTSPACE_CREATE_ROUTE = CREATE_LAB_PATHNAME;

/** Unified create entry — opens the HostSpace Creation Lab. */
export const CREATE_HUB_ROUTE = CREATE_LAB_PATHNAME;

/** @deprecated Host tab no longer hosts Create; use `CREATE_HUB_ROUTE` / `HOST_CREATE_PARAMS` only if a deep link still references this shape. */
export const HOST_CREATE_PARAMS = { space: 'create' } as const;

/** @deprecated Prefer `CREATE_HUB_ROUTE`; Host tab routes to `/hostspace`. */
export const HOST_TAB_PATHNAME = '/(tabs)/host' as const;

/** Public URL for the unified listing / directory profile wizard. */
export const LISTING_CREATE_ROUTE = LISTING_WIZARD_PUBLIC_PATHNAME;

/**
 * Host workspace deep link: Listings tab + open unified listing wizard.
 * Pass as `router.push({ pathname: '/(tabs)/host', params: HOST_NEW_LISTING_PARAMS })`.
 * Optional `listingEntityType` seeds the wizard (business, venue, artist, organizer, community, event).
 */
export const HOST_NEW_LISTING_PARAMS = {
  tab: 'listings',
  newListing: '1',
} as const;

/** Directory listing kinds supported by Host → New listing (matches Profile.entityType subset). */
export type HostListingEntityParam = 'business' | 'venue' | 'artist' | 'organizer' | 'restaurant';

/** Entity param values accepted by `listing/create` (directory subset + community + event redirect). */
export type ListingWizardEntityParam = HostListingEntityParam | 'community' | 'event' | 'brand' | 'creator';

export function hostNewListingParams(entityType?: ListingWizardEntityParam) {
  if (!entityType) return { ...HOST_NEW_LISTING_PARAMS };
  return {
    ...HOST_NEW_LISTING_PARAMS,
    listingEntityType: entityType,
  } as const;
}

/** Navigate object for Expo Router — use with `router.push` / `href`. */
export function listingCreateNavigateParams(entityType?: ListingWizardEntityParam) {
  if (entityType === 'community') {
    return { pathname: createLabCategoryHref('community') } as const;
  }

  return {
    pathname: LISTING_CREATE_ROUTE,
    ...(entityType ? { params: { listingEntityType: entityType } } : {}),
  } as const;
}

/** Profile “tool” rows (title + subtitle + path). */
export type ProfileToolRow = {
  id: string;
  label: string;
  sub: string;
  path: string;
  icon: IonIcon;
  accent: string;
};

export const PROFILE_ATTENDEE_TOOL_ROWS: ProfileToolRow[] = [
  { id: 'tickets', label: 'My tickets', sub: 'QR codes, transfers, and gate entry', path: '/tickets', icon: 'ticket-outline', accent: CultureTokens.gold },
  { id: 'cal-sync', label: 'Calendar sync', sub: 'Apple, Google, Outlook and device', path: '/settings/calendar-sync', icon: 'calendar-outline', accent: CultureTokens.indigo },
];

export const PROFILE_HOST_ORGANIZER_ROWS: ProfileToolRow[] = [
  { id: 'create', label: 'Create', sub: 'Events, communities, and directory listings', path: CREATE_HUB_ROUTE, icon: 'add-circle-outline', accent: CultureTokens.teal },
  { id: 'dash', label: 'Host dashboard', sub: 'Events, drafts, and ticket performance', path: '/hostspace/dashboard', icon: 'grid-outline', accent: CultureTokens.indigo },
  { id: 'scan', label: 'Ticket scanner', sub: 'Scan attendee QR codes at the gate', path: '/scanner', icon: 'qr-code-outline', accent: CultureTokens.gold },
];

export const PROFILE_HOST_ASPIRING_ROWS: ProfileToolRow[] = [
  { id: 'create', label: 'Start Creating', sub: 'Events, communities, listings & more in HostSpace', path: CREATE_HUB_ROUTE, icon: 'add-circle-outline', accent: CultureTokens.teal },
  { id: 'help', label: 'Host help', sub: 'FAQs, payouts, and getting verified', path: '/help', icon: 'help-circle-outline', accent: CultureTokens.gold },
];

// ── Web sidebar (matches NavItem shape in WebSidebar) ─────────────────────────

export type SidebarNavLink = {
  label: string;
  icon: IonIcon;
  iconActive: IonIcon;
  route: string;
  matchPrefix?: boolean;
  badge?: number;
};

/** Going out: tickets, saves, contacts, calendar & comms (Calendar tab lives under Discover). */
export const SIDEBAR_ATTENDEE_LINKS: SidebarNavLink[] = [
  { label: 'My Tickets', icon: 'ticket-outline', iconActive: 'ticket', route: '/tickets' },
];

/** Browse catalogues (separate from attendee “my stuff”). CultureX lives under Discover in MAIN_NAV — do not duplicate here (web sidebar keys). */
export const SIDEBAR_BROWSE_LINKS: SidebarNavLink[] = [
  {
    label: 'CultureMarket',
    icon: 'storefront-outline',
    iconActive: 'storefront',
    route: '/CultureMarket',
    matchPrefix: true,
  },
  {
    label: 'Daily Deals',
    icon: 'pricetag-outline',
    iconActive: 'pricetag',
    route: '/CultureShop',
    matchPrefix: true,
  },
  { label: 'All Events', icon: 'calendar-number-outline', iconActive: 'calendar-number', route: '/events', matchPrefix: true },
  { label: 'Map', icon: 'map-outline', iconActive: 'map', route: '/map' },
  { label: 'Directory', icon: 'grid-outline', iconActive: 'grid', route: '/(tabs)/directory', matchPrefix: true },
];

export const SIDEBAR_HOST_HUB_LINKS: SidebarNavLink[] = [
  { label: 'Create', icon: 'add-circle-outline', iconActive: 'add-circle', route: CREATE_HUB_ROUTE },
  { label: 'Host Dashboard', icon: 'grid-outline', iconActive: 'grid', route: '/hostspace/dashboard', matchPrefix: true },
  { label: 'Ticket Scanner', icon: 'qr-code-outline', iconActive: 'qr-code', route: '/scanner' },
];

export const SIDEBAR_HOST_ASPIRING_LINKS: SidebarNavLink[] = [
  { label: 'Start Creating', icon: 'add-circle-outline', iconActive: 'add-circle', route: CREATE_HUB_ROUTE },
  { label: 'Host help', icon: 'help-circle-outline', iconActive: 'help-circle', route: '/help' },
];

// ── Full-screen menu (Account menu) sections ─────────────────────────────────

export type ExperienceMenuItem = {
  id: string;
  label: string;
  icon: IonIcon;
  route: string;
  color?: string;
  requiresAuth?: boolean;
  requiresOrganizer?: boolean;
  requiresAdmin?: boolean;
  requiresSuperAdmin?: boolean;
};

export type ExperienceMenuSection = { title: string; items: ExperienceMenuItem[] };

export const MENU_ATTENDEE_SECTION: ExperienceMenuSection = {
  title: 'Attendee',
  items: [
    { id: 'att-cal', label: 'My calendar', icon: 'calendar-outline', route: '/(tabs)/calendar', color: CultureTokens.indigo },
    { id: 'att-tix', label: 'My tickets', icon: 'ticket-outline', route: '/tickets', requiresAuth: true, color: CultureTokens.gold },
    { id: 'att-sync', label: 'Calendar sync', icon: 'sync-outline', route: '/settings/calendar-sync', requiresAuth: true, color: CultureTokens.indigo },
  ],
};

export function menuHostHubSection(isOrganizer: boolean): ExperienceMenuSection {
  if (isOrganizer) {
    return {
      title: 'Host Studio',
      items: [
        { id: 'host-create', label: 'Create', icon: 'add-circle-outline', route: CREATE_HUB_ROUTE, requiresAuth: true, requiresOrganizer: true, color: CultureTokens.teal },
        { id: 'host-dash', label: 'Host Dashboard', icon: 'grid-outline', route: '/hostspace/dashboard', requiresAuth: true, requiresOrganizer: true, color: CultureTokens.indigo },
        { id: 'host-scan', label: 'Ticket Scanner', icon: 'qr-code-outline', route: '/scanner', requiresAuth: true, requiresOrganizer: true, color: CultureTokens.gold },
      ],
    };
  }
  return {
    title: 'Host Studio',
    items: [
      { id: 'host-create-all', label: 'Start Creating', icon: 'add-circle-outline', route: CREATE_HUB_ROUTE, color: CultureTokens.teal },
      { id: 'host-help', label: 'Host help', icon: 'help-circle-outline', route: '/help', color: CultureTokens.gold },
    ],
  };
}

/** One row in Settings lists (shape matches `SettingItem` minus optional `action`). */
export type SettingsNavRow = {
  icon: IonIcon;
  label: string;
  sub?: string;
  color: string;
  route: string;
};

/**
 * Settings → My Content: tickets & saved routes/icons from profile rows;
 * communities stays app-specific here so one place owns the path.
 */
export function settingsMyContentItems(): SettingsNavRow[] {
  const tickets = PROFILE_ATTENDEE_TOOL_ROWS.find((r) => r.id === 'tickets');
  if (!tickets) {
    throw new Error('[experienceNav] PROFILE_ATTENDEE_TOOL_ROWS must include tickets');
  }
  return [
    {
      icon: tickets.icon,
      label: 'My Tickets',
      sub: 'Upcoming and past events',
      color: tickets.accent,
      route: tickets.path,
    },
    {
      icon: 'people-outline',
      label: 'My Communities',
      sub: "Groups you've joined",
      color: CultureTokens.teal,
      route: '/(tabs)/community',
    },
  ];
}

const SETTINGS_ORGANIZER_COPY: Record<string, { label: string; sub: string }> = {
  create: { label: 'Create', sub: 'Events, communities, and directory listings' },
  dash: { label: 'Host Dashboard', sub: 'Manage your events and tickets' },
  scan: { label: 'Ticket Scanner', sub: 'Scan attendee tickets at gate' },
};

/** Settings → Host Hub (organizer): same destinations as profile; copy tuned for the settings list. */
export function settingsOrganizerHostHubItems(): SettingsNavRow[] {
  return PROFILE_HOST_ORGANIZER_ROWS.map((row) => {
    const text = SETTINGS_ORGANIZER_COPY[row.id];
    if (!text) {
      throw new Error(`[experienceNav] Missing SETTINGS_ORGANIZER_COPY for id "${row.id}"`);
    }
    return {
      icon: row.icon,
      label: text.label,
      sub: text.sub,
      color: row.accent,
      route: row.path,
    };
  });
}

function attendeeRow(id: ProfileToolRow['id']): ProfileToolRow {
  const row = PROFILE_ATTENDEE_TOOL_ROWS.find((r) => r.id === id);
  if (!row) throw new Error(`[experienceNav] Missing PROFILE_ATTENDEE_TOOL_ROWS id "${id}"`);
  return row;
}

/** App → Calendar Sync (same route/icon as attendee profile row). */
export function settingsAppCalendarSyncItem(): SettingsNavRow {
  const row = attendeeRow('cal-sync');
  return {
    icon: row.icon,
    label: 'Calendar Sync',
    sub: 'Apple, Google, Outlook & device',
    color: row.accent,
    route: row.path,
  };
}

/** Help & Support → Help Center (same route as host help / menu). */
export function settingsHelpCenterItem(): SettingsNavRow {
  const row = PROFILE_HOST_ASPIRING_ROWS.find((r) => r.id === 'help');
  if (!row) throw new Error('[experienceNav] Missing host help row');
  return {
    icon: row.icon,
    label: 'Help Center',
    sub: 'FAQs, guides, tutorials',
    color: row.accent,
    route: row.path,
  };
}
/** App → What's New (About section). */
export function settingsAboutWhatsNewItem(): SettingsNavRow {
  return {
    icon: 'sparkles-outline',
    label: "What's New",
    sub: 'Recent updates and features',
    color: CultureTokens.indigo,
    route: '/updates',
  };
}

// ── Admin / SuperAdmin sidebar nav (for WebSidebar + admin shell consistency) ─
export const SIDEBAR_ADMIN_LINKS: SidebarNavLink[] = [
  { label: 'AdminSpace', icon: 'shield-half-outline', iconActive: 'shield-half', route: '/admin', matchPrefix: false },
  { label: 'Discover Curation', icon: 'sparkles-outline', iconActive: 'sparkles', route: '/admin/discover', matchPrefix: true },
  { label: 'Users', icon: 'people-outline', iconActive: 'people', route: '/admin/users', matchPrefix: true },
  { label: 'Audit Logs', icon: 'list-outline', iconActive: 'list', route: '/admin/audit-logs', matchPrefix: true },
  { label: 'Compliance', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', route: '/admin/data-compliance', matchPrefix: true },
  { label: 'Platform', icon: 'settings-outline', iconActive: 'settings', route: '/admin/platform', matchPrefix: true },
  { label: 'Finance', icon: 'card-outline', iconActive: 'card', route: '/admin/finance', matchPrefix: true },
  { label: 'Moderation', icon: 'eye-outline', iconActive: 'eye', route: '/admin/moderation', matchPrefix: true },
];

export const SIDEBAR_SUPERADMIN_LINKS: SidebarNavLink[] = [
  { label: 'Cockpit (Root)', icon: 'rocket-outline', iconActive: 'rocket', route: '/admin', matchPrefix: true },
  { label: 'Audit Logs', icon: 'list-outline', iconActive: 'list', route: '/admin/audit-logs', matchPrefix: true },
  { label: 'Compliance', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', route: '/admin/data-compliance', matchPrefix: true },
  { label: 'Platform', icon: 'settings-outline', iconActive: 'settings', route: '/admin/platform', matchPrefix: true },
];
