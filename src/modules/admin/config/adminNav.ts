/**
 * Grouped admin navigation — single source for sidebar, mobile sheet, and dashboard directory.
 */
import type { UserRole } from '@/shared/schema';

export type AdminNavItem = {
  label: string;
  icon: string;
  route: string;
  /** Minimum role rank to see this item (default: admin) */
  minRole?: UserRole | 'moderator';
  badgeKey?: 'moderation' | 'verification' | 'hostApplications';
};

export type AdminNavSection = {
  id: string;
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      { label: 'Mission Control', icon: 'grid', route: '/admin' },
      { label: 'HostSpace Ops', icon: 'briefcase', route: '/admin/hostspace', badgeKey: 'hostApplications' },
    ],
  },
  {
    id: 'people',
    title: 'People & Trust',
    items: [
      { label: 'User Directory', icon: 'people', route: '/admin/users' },
      { label: 'Host Applications', icon: 'person-add', route: '/admin/host-applications', badgeKey: 'hostApplications' },
      { label: 'Communities', icon: 'people-circle', route: '/admin/communities' },
      { label: 'Moderation', icon: 'shield-checkmark', route: '/admin/moderation', minRole: 'moderator', badgeKey: 'moderation' },
      { label: 'Verification', icon: 'document-lock', route: '/admin/verification', badgeKey: 'verification' },
    ],
  },
  {
    id: 'growth',
    title: 'Growth & Revenue',
    items: [
      { label: 'Campaign Push', icon: 'megaphone', route: '/admin/notifications' },
      { label: 'Promo Codes', icon: 'pricetag', route: '/admin/promo-codes' },
      { label: 'Community Banner', icon: 'home', route: '/admin/community-banner' },
      { label: 'Financials', icon: 'card', route: '/admin/finance' },
      { label: 'Discovery', icon: 'sparkles', route: '/admin/discover' },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    items: [
      { label: 'Team Monitoring', icon: 'people-circle', route: '/admin/team-monitoring' },
      { label: 'Member Monitoring', icon: 'analytics', route: '/admin/member-monitoring' },
      { label: 'AI Timesheet', icon: 'time', route: '/admin/timesheet' },
    ],
  },
  {
    id: 'system',
    title: 'System',
    items: [
      { label: 'Audit Logs', icon: 'list', route: '/admin/audit-logs' },
      { label: 'Indexes Health', icon: 'pulse', route: '/admin/indexes-health' },
      { label: 'Platform Config', icon: 'settings', route: '/admin/platform' },
      { label: 'Compliance', icon: 'lock-closed', route: '/admin/data-compliance' },
    ],
  },
];

const ROLE_RANK: Record<string, number> = {
  user: 0,
  organizer: 1,
  business: 1,
  sponsor: 1,
  cityAdmin: 2,
  moderator: 3,
  admin: 4,
  platformAdmin: 4,
  superAdmin: 5,
};

export function canAccessAdminNavItem(role: UserRole | undefined, minRole?: AdminNavItem['minRole']): boolean {
  const required = minRole ?? 'admin';
  const userRank = ROLE_RANK[role ?? 'user'] ?? 0;
  const requiredRank = ROLE_RANK[required] ?? 4;
  if (userRank >= ROLE_RANK.admin) return true;
  return userRank >= requiredRank;
}

export function filterAdminNavForRole(
  role: UserRole | undefined,
  sections: AdminNavSection[] = ADMIN_NAV_SECTIONS,
): AdminNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessAdminNavItem(role, item.minRole)),
    }))
    .filter((section) => section.items.length > 0);
}

export function flattenAdminNav(sections: AdminNavSection[]): AdminNavItem[] {
  return sections.flatMap((s) => s.items);
}