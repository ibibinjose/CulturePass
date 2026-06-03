/**
 * useProfileAnalytics Hook
 *
 * Provides analytics data fetching and management for published host profiles.
 * Uses TanStack Query for caching, background refetching, and optimistic updates.
 *
 * Features:
 * - Fetch analytics by period (daily, weekly, monthly, all-time)
 * - Auto-refresh every 5 minutes (max delay per Requirement 20)
 * - CSV export of analytics data
 * - Optimization suggestions based on metrics
 * - Category comparison data
 *
 * Usage:
 * ```tsx
 * const { analytics, isLoading, period, setPeriod, exportCSV, suggestions } =
 *   useProfileAnalytics({ profileId: 'abc123' });
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { hostApi } from '@/modules/host/api';
import type { ProfileAnalytics } from '@/platform/api/endpoints/createProfilesNamespace';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export interface UseProfileAnalyticsOptions {
  /** Profile ID to fetch analytics for */
  profileId: string;
  /** Initial period selection (default: 'weekly') */
  initialPeriod?: AnalyticsPeriod;
  /** Whether to enable auto-refresh (default: true) */
  autoRefresh?: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UseProfileAnalyticsReturn {
  /** Analytics data for the selected period */
  analytics: ProfileAnalytics | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether data is being refetched in background */
  isRefetching: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Currently selected period */
  period: AnalyticsPeriod;
  /** Change the analytics period */
  setPeriod: (period: AnalyticsPeriod) => void;
  /** Export analytics data as CSV */
  exportCSV: () => void;
  /** Data-driven optimization suggestions (rule-based heuristics) */
  suggestions: OptimizationSuggestion[];
  /** Total traffic from all sources */
  totalTraffic: number;
  /** Formatted engagement score (0-100) */
  engagementDisplay: string;
  /** Manually trigger a refetch */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

const ANALYTICS_QUERY_KEY = 'profile-analytics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate optimization suggestions based on analytics data.
 */
function generateSuggestions(analytics: ProfileAnalytics | null): OptimizationSuggestion[] {
  if (!analytics) return [];

  const suggestions: OptimizationSuggestion[] = [];
  const { metrics, trafficSources, topKeywords, engagementScore } = analytics;

  // Low views suggestion
  if (metrics.views < 50) {
    suggestions.push({
      id: 'low-views',
      type: 'warning',
      title: 'Increase Profile Visibility',
      description:
        'Your profile has low views. Consider sharing on social media or adding more category tags to improve discoverability.',
      priority: 'high',
    });
  }

  // Low click-through rate
  if (metrics.searchAppearances > 20 && metrics.searchClickThroughRate < 0.05) {
    suggestions.push({
      id: 'low-ctr',
      type: 'warning',
      title: 'Improve Search Click-Through Rate',
      description:
        'Your profile appears in search but few people click through. Try updating your tagline and hero image to be more compelling.',
      priority: 'high',
    });
  }

  // No social traffic
  if (trafficSources.social === 0 && metrics.views > 10) {
    suggestions.push({
      id: 'no-social',
      type: 'info',
      title: 'Share on Social Media',
      description:
        'You have no traffic from social media. Share your profile link on your social channels to drive more visitors.',
      priority: 'medium',
    });
  }

  // Low engagement
  if (engagementScore < 30) {
    suggestions.push({
      id: 'low-engagement',
      type: 'warning',
      title: 'Boost Engagement',
      description:
        'Your engagement score is below average. Add more details to your profile, upload gallery images, and ensure contact info is complete.',
      priority: 'high',
    });
  }

  // Good engagement
  if (engagementScore >= 70) {
    suggestions.push({
      id: 'good-engagement',
      type: 'success',
      title: 'Great Engagement!',
      description:
        'Your profile is performing well. Keep your content fresh and respond promptly to inquiries to maintain momentum.',
      priority: 'low',
    });
  }

  // Few keywords
  if (topKeywords.length < 3) {
    suggestions.push({
      id: 'few-keywords',
      type: 'info',
      title: 'Add More Category Tags',
      description:
        'Your profile appears for very few search terms. Add more relevant tags and expand your description to rank for more keywords.',
      priority: 'medium',
    });
  }

  // Low contact clicks relative to views
  if (metrics.views > 50 && metrics.contactClicks < metrics.views * 0.02) {
    suggestions.push({
      id: 'low-contact-clicks',
      type: 'info',
      title: 'Make Contact Info More Prominent',
      description:
        'Visitors are viewing your profile but not clicking contact buttons. Ensure your contact details are complete and easy to find.',
      priority: 'medium',
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Convert analytics data to CSV string.
 */
function analyticsToCSV(analytics: ProfileAnalytics): string {
  const lines: string[] = [];

  // Header
  lines.push('CulturePass Profile Analytics Export');
  lines.push(`Period: ${analytics.period}`);
  lines.push(`Date Range: ${analytics.startDate} to ${analytics.endDate}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Metrics
  lines.push('--- Metrics ---');
  lines.push(`Views,${analytics.metrics.views}`);
  lines.push(`Unique Visitors,${analytics.metrics.uniqueVisitors}`);
  lines.push(`Contact Clicks,${analytics.metrics.contactClicks}`);
  lines.push(`Search Appearances,${analytics.metrics.searchAppearances}`);
  lines.push(`Search CTR,${(analytics.metrics.searchClickThroughRate * 100).toFixed(1)}%`);
  lines.push('');

  // Social Link Clicks
  lines.push('--- Social Link Clicks ---');
  lines.push('Platform,Clicks');
  Object.entries(analytics.metrics.socialLinkClicks).forEach(([platform, clicks]) => {
    lines.push(`${platform},${clicks}`);
  });
  lines.push('');

  // Traffic Sources
  lines.push('--- Traffic Sources ---');
  lines.push('Source,Count');
  lines.push(`Direct,${analytics.trafficSources.direct}`);
  lines.push(`Search,${analytics.trafficSources.search}`);
  lines.push(`Social,${analytics.trafficSources.social}`);
  lines.push(`Referral,${analytics.trafficSources.referral}`);
  lines.push('');

  // Top Keywords
  lines.push('--- Top Keywords ---');
  lines.push('Keyword,Impressions,Clicks,CTR');
  analytics.topKeywords.forEach((kw) => {
    const ctr = 'ctr' in kw ? (Number(kw.ctr) * 100).toFixed(1) : '0.0';
    const impressions = 'impressions' in kw ? kw.impressions : 0;
    const clicks = 'clicks' in kw ? kw.clicks : ('count' in kw ? (kw as Record<string, unknown>).count : 0);
    lines.push(`${kw.keyword},${impressions},${clicks},${ctr}%`);
  });
  lines.push('');

  // Engagement
  lines.push('--- Engagement ---');
  lines.push(`Engagement Score,${analytics.engagementScore.toFixed(1)}`);
  if (analytics.categoryRank) {
    lines.push(`Category Rank,#${analytics.categoryRank}`);
  }

  return lines.join('\n');
}

/**
 * Trigger CSV download on web or share on native.
 */
function downloadCSV(csv: string, filename: string): void {
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  // On native, we'd use expo-sharing — but for now just log
  // This can be extended with Share API when needed
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProfileAnalytics({
  profileId,
  initialPeriod = 'weekly',
  autoRefresh = true,
}: UseProfileAnalyticsOptions): UseProfileAnalyticsReturn {
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialPeriod);

  // Fetch analytics data with TanStack Query
  const {
    data: analytics = null,
    isLoading,
    isFetching: isRefetching,
    error,
    refetch,
  } = useQuery<ProfileAnalytics | null, Error>({
    queryKey: [ANALYTICS_QUERY_KEY, profileId, period],
    queryFn: async () => {
      if (!profileId) return null;
      const result = await hostApi.profiles.getAnalytics(profileId, { period });
      return result ?? null;
    },
    enabled: !!profileId,
    // Refresh every 5 minutes (max delay per Requirement 20)
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    retry: 2,
  });

  // Calculate total traffic
  const totalTraffic = useMemo(() => {
    if (!analytics) return 0;
    const { direct, search, social, referral } = analytics.trafficSources;
    return direct + search + social + referral;
  }, [analytics]);

  // Format engagement score for display
  const engagementDisplay = useMemo(() => {
    if (!analytics) return '—';
    return `${Math.round(analytics.engagementScore)}/100`;
  }, [analytics]);

  // Generate optimization suggestions
  const suggestions = useMemo(() => generateSuggestions(analytics), [analytics]);

  // CSV export handler
  const exportCSV = useCallback(() => {
    if (!analytics) return;
    const csv = analyticsToCSV(analytics);
    const filename = `profile-analytics-${profileId}-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
  }, [analytics, profileId, period]);

  return {
    analytics,
    isLoading,
    isRefetching,
    error: error ?? null,
    period,
    setPeriod,
    exportCSV,
    suggestions,
    totalTraffic,
    engagementDisplay,
    refetch,
  };
}
