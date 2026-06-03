/**
 * AnalyticsDashboard Component
 *
 * Post-publish analytics dashboard for host profiles. Displays key performance
 * metrics, traffic sources, top keywords, engagement score, category comparison,
 * optimization suggestions, and CSV export.
 *
 * Features:
 * - Period selector (7-day, 30-day, all-time)
 * - Metric cards (views, visitors, clicks, search appearances)
 * - Traffic sources breakdown with visual bars
 * - Top keywords table
 * - Engagement score gauge
 * - Category comparison indicator
 * - Rule-based optimization suggestions (data-driven)
 * - CSV export button
 * - Mobile-responsive design (320px+)
 * - Accessibility support (WCAG 2.1 Level AA)
 *
 * Usage:
 * ```tsx
 * <AnalyticsDashboard profileId="abc123" />
 * ```
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import {
  useProfileAnalytics,
  type AnalyticsPeriod,
  type OptimizationSuggestion,
} from '../hooks/useProfileAnalytics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsDashboardProps {
  /** Profile ID to display analytics for */
  profileId: string;
  /** Optional callback when user wants to navigate to profile edit */
  onEditProfile?: () => void;
}

// ---------------------------------------------------------------------------
// Period Config
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'daily', label: '24h' },
  { value: 'weekly', label: '7 days' },
  { value: 'monthly', label: '30 days' },
  { value: 'all-time', label: 'All time' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticsDashboard({ profileId, onEditProfile }: AnalyticsDashboardProps) {
  const colors = useColors();
  const { isMobile, isDesktop } = useLayout();

  const {
    analytics,
    isLoading,
    isRefetching,
    error,
    period,
    setPeriod,
    exportCSV,
    suggestions,
    totalTraffic,
    engagementDisplay,
    refetch,
  } = useProfileAnalytics({ profileId });

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading analytics"
      >
        <ActivityIndicator size="large" color={CultureTokens.violet} />
        <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={CultureTokens.coral} />
        <Text style={[TextStyles.title3, { color: colors.text, marginTop: Spacing.md }]}>
          Unable to load analytics
        </Text>
        <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
          {error.message || 'Please try again later.'}
        </Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: CultureTokens.violet }]}
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading analytics"
        >
          <Text style={[TextStyles.callout, { color: '#FFFFFF' }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[TextStyles.title2, { color: colors.text }]}
            accessibilityRole="header"
            aria-level={1}
          >
            Analytics
          </Text>
          {isRefetching && (
            <ActivityIndicator
              size="small"
              color={CultureTokens.violet}
              style={styles.refreshIndicator}
            />
          )}
        </View>
        <Pressable
          style={[styles.exportButton, { borderColor: colors.border }]}
          onPress={exportCSV}
          accessibilityRole="button"
          accessibilityLabel="Export analytics as CSV"
        >
          <Ionicons name="download-outline" size={18} color={colors.text} />
          <Text style={[TextStyles.caption, { color: colors.text }]}>Export CSV</Text>
        </Pressable>
      </View>

      {/* Period Selector */}
      <PeriodSelector
        period={period}
        onSelect={setPeriod}
        colors={colors}
      />

      {/* Metric Cards */}
      <View style={[styles.metricsGrid, isMobile && styles.metricsGridMobile]}>
        <MetricCard
          icon="eye-outline"
          label="Profile Views"
          value={analytics?.metrics.views ?? 0}
          colors={colors}
          accentColor={CultureTokens.indigo}
        />
        <MetricCard
          icon="people-outline"
          label="Unique Visitors"
          value={analytics?.metrics.uniqueVisitors ?? 0}
          colors={colors}
          accentColor={CultureTokens.violet}
        />
        <MetricCard
          icon="hand-left-outline"
          label="Contact Clicks"
          value={analytics?.metrics.contactClicks ?? 0}
          colors={colors}
          accentColor={CultureTokens.teal}
        />
        <MetricCard
          icon="search-outline"
          label="Search Appearances"
          value={analytics?.metrics.searchAppearances ?? 0}
          colors={colors}
          accentColor={CultureTokens.coral}
        />
      </View>

      {/* Engagement Score */}
      <EngagementScoreCard
        score={analytics?.engagementScore ?? 0}
        display={engagementDisplay}
        categoryRank={analytics?.categoryRank}
        colors={colors}
      />

      {/* Traffic Sources */}
      <TrafficSourcesCard
        sources={analytics?.trafficSources ?? { direct: 0, search: 0, social: 0, referral: 0 }}
        total={totalTraffic}
        colors={colors}
      />

      {/* Top Keywords */}
      <TopKeywordsCard
        keywords={analytics?.topKeywords ?? []}
        colors={colors}
      />

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <SuggestionsCard
          suggestions={suggestions}
          colors={colors}
          onEditProfile={onEditProfile}
        />
      )}

      {/* Last Updated */}
      {analytics?.updatedAt && (
        <Text
          style={[
            TextStyles.caption,
            { color: colors.textTertiary, textAlign: 'center', marginTop: Spacing.lg },
          ]}
        >
          Last updated: {new Date(analytics.updatedAt).toLocaleString()}
        </Text>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Period Selector
// ---------------------------------------------------------------------------

interface PeriodSelectorProps {
  period: AnalyticsPeriod;
  onSelect: (period: AnalyticsPeriod) => void;
  colors: ReturnType<typeof useColors>;
}

function PeriodSelector({ period, onSelect, colors }: PeriodSelectorProps) {
  return (
    <View
      style={[styles.periodContainer, { backgroundColor: colors.surface }]}
      accessibilityRole="tablist"
      accessibilityLabel="Analytics period selector"
    >
      {PERIOD_OPTIONS.map((option) => {
        const isActive = period === option.value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.periodTab,
              isActive && [styles.periodTabActive, { backgroundColor: CultureTokens.violet }],
            ]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Show ${option.label} analytics`}
          >
            <Text
              style={[
                TextStyles.caption,
                {
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
  accentColor: string;
}

function MetricCard({ icon, label, value, colors, accentColor }: MetricCardProps) {
  const formattedValue = useMemo(() => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  }, [value]);

  return (
    <View
      style={[
        styles.metricCard,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.metricIconContainer, { backgroundColor: accentColor + '15' }]}>
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
      <Text style={[TextStyles.title2, { color: colors.text, marginTop: Spacing.sm }]}>
        {formattedValue}
      </Text>
      <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Engagement Score Card
// ---------------------------------------------------------------------------

interface EngagementScoreCardProps {
  score: number;
  display: string;
  categoryRank?: number;
  colors: ReturnType<typeof useColors>;
}

function EngagementScoreCard({ score, display, categoryRank, colors }: EngagementScoreCardProps) {
  const scoreColor = useMemo(() => {
    if (score >= 70) return CultureTokens.teal;
    if (score >= 40) return CultureTokens.gold;
    return CultureTokens.coral;
  }, [score]);

  const scoreLabel = useMemo(() => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Good';
    return 'Needs Improvement';
  }, [score]);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      accessibilityRole="text"
      accessibilityLabel={`Engagement score: ${Math.round(score)} out of 100, ${scoreLabel}`}
    >
      <Text style={[TextStyles.title3, { color: colors.text }]}>Engagement Score</Text>

      <View style={styles.engagementContent}>
        {/* Score Circle */}
        <View style={styles.scoreCircleContainer}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[TextStyles.title, { color: scoreColor }]}>
              {Math.round(score)}
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>/100</Text>
          </View>
          <Text style={[TextStyles.caption, { color: scoreColor, marginTop: Spacing.xs }]}>
            {scoreLabel}
          </Text>
        </View>

        {/* Category Comparison */}
        {categoryRank != null && (
          <View style={styles.categoryComparison}>
            <Ionicons name="trophy-outline" size={20} color={CultureTokens.gold} />
            <Text style={[TextStyles.body, { color: colors.text, marginTop: Spacing.xs }]}>
              #{categoryRank}
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
              in category
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={[styles.engagementBar, { backgroundColor: colors.borderLight }]}>
        <View
          style={[
            styles.engagementBarFill,
            { width: `${Math.min(score, 100)}%`, backgroundColor: scoreColor },
          ]}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Traffic Sources Card
// ---------------------------------------------------------------------------

interface TrafficSourcesCardProps {
  sources: { direct: number; search: number; social: number; referral: number };
  total: number;
  colors: ReturnType<typeof useColors>;
}

const TRAFFIC_SOURCE_CONFIG: {
  key: 'direct' | 'search' | 'social' | 'referral';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: 'direct', label: 'Direct', icon: 'link-outline', color: CultureTokens.indigo },
  { key: 'search', label: 'Search', icon: 'search-outline', color: CultureTokens.teal },
  { key: 'social', label: 'Social', icon: 'share-social-outline', color: CultureTokens.violet },
  { key: 'referral', label: 'Referral', icon: 'globe-outline', color: CultureTokens.coral },
];

function TrafficSourcesCard({ sources, total, colors }: TrafficSourcesCardProps) {
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      accessibilityRole="text"
      accessibilityLabel="Traffic sources breakdown"
    >
      <Text style={[TextStyles.title3, { color: colors.text }]}>Traffic Sources</Text>

      {total === 0 ? (
        <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          No traffic data available yet.
        </Text>
      ) : (
        <View style={styles.trafficList}>
          {TRAFFIC_SOURCE_CONFIG.map((source) => {
            const count = sources[source.key];
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <View key={source.key} style={styles.trafficRow}>
                <View style={styles.trafficLabel}>
                  <Ionicons name={source.icon} size={16} color={source.color} />
                  <Text style={[TextStyles.callout, { color: colors.text, marginLeft: Spacing.xs }]}>
                    {source.label}
                  </Text>
                </View>
                <View style={styles.trafficBarContainer}>
                  <View style={[styles.trafficBar, { backgroundColor: colors.borderLight }]}>
                    <View
                      style={[
                        styles.trafficBarFill,
                        { width: `${percentage}%`, backgroundColor: source.color },
                      ]}
                    />
                  </View>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary, minWidth: 44, textAlign: 'right' }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Top Keywords Card
// ---------------------------------------------------------------------------

interface TopKeywordsCardProps {
  keywords: { keyword: string; impressions?: number; clicks?: number; ctr?: number; count?: number }[];
  colors: ReturnType<typeof useColors>;
}

function TopKeywordsCard({ keywords, colors }: TopKeywordsCardProps) {
  if (keywords.length === 0) {
    return (
      <View
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      >
        <Text style={[TextStyles.title3, { color: colors.text }]}>Top Keywords</Text>
        <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          No keyword data available yet. Keywords will appear once your profile starts showing in search results.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      accessibilityRole="none"
      accessibilityLabel="Top keywords table"
    >
      <Text style={[TextStyles.title3, { color: colors.text }]}>Top Keywords</Text>

      {/* Table Header */}
      <View style={[styles.keywordRow, styles.keywordHeader]}>
        <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary, flex: 1 }]}>
          Keyword
        </Text>
        <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary, width: 60, textAlign: 'right' }]}>
          Impr.
        </Text>
        <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary, width: 50, textAlign: 'right' }]}>
          Clicks
        </Text>
        <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary, width: 50, textAlign: 'right' }]}>
          CTR
        </Text>
      </View>

      {/* Table Rows */}
      {keywords.slice(0, 10).map((kw, index) => {
        const impressions = kw.impressions ?? 0;
        const clicks = kw.clicks ?? kw.count ?? 0;
        const ctr = kw.ctr != null ? kw.ctr : (impressions > 0 ? clicks / impressions : 0);

        return (
          <View
            key={`${kw.keyword}-${index}`}
            style={[
              styles.keywordRow,
              { borderTopColor: colors.borderLight, borderTopWidth: 1 },
            ]}
          >
            <Text
              style={[TextStyles.callout, { color: colors.text, flex: 1 }]}
              numberOfLines={1}
            >
              {kw.keyword}
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary, width: 60, textAlign: 'right' }]}>
              {impressions.toLocaleString()}
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary, width: 50, textAlign: 'right' }]}>
              {clicks.toLocaleString()}
            </Text>
            <Text style={[TextStyles.caption, { color: CultureTokens.teal, width: 50, textAlign: 'right' }]}>
              {(ctr * 100).toFixed(1)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Suggestions Card
// ---------------------------------------------------------------------------

interface SuggestionsCardProps {
  suggestions: OptimizationSuggestion[];
  colors: ReturnType<typeof useColors>;
  onEditProfile?: () => void;
}

function SuggestionsCard({ suggestions, colors, onEditProfile }: SuggestionsCardProps) {
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      accessibilityRole="list"
      accessibilityLabel="Optimization suggestions"
    >
      <View style={styles.suggestionsHeader}>
        <Ionicons name="bulb-outline" size={20} color={CultureTokens.violet} />
        <Text style={[TextStyles.title3, { color: colors.text, marginLeft: Spacing.xs }]}>
          Optimization Suggestions
        </Text>
      </View>

      {suggestions.map((suggestion) => (
        <SuggestionItem key={suggestion.id} suggestion={suggestion} colors={colors} />
      ))}

      {onEditProfile && (
        <Pressable
          style={[styles.editProfileButton, { borderColor: CultureTokens.violet }]}
          onPress={onEditProfile}
          accessibilityRole="button"
          accessibilityLabel="Edit profile to apply suggestions"
        >
          <Ionicons name="create-outline" size={16} color={CultureTokens.violet} />
          <Text style={[TextStyles.callout, { color: CultureTokens.violet, marginLeft: Spacing.xs }]}>
            Edit Profile
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Suggestion Item
// ---------------------------------------------------------------------------

interface SuggestionItemProps {
  suggestion: OptimizationSuggestion;
  colors: ReturnType<typeof useColors>;
}

function SuggestionItem({ suggestion, colors }: SuggestionItemProps) {
  const iconConfig = useMemo(() => {
    switch (suggestion.type) {
      case 'warning':
        return { name: 'warning-outline' as const, color: CultureTokens.coral };
      case 'success':
        return { name: 'checkmark-circle-outline' as const, color: CultureTokens.teal };
      case 'info':
      default:
        return { name: 'information-circle-outline' as const, color: CultureTokens.indigo };
    }
  }, [suggestion.type]);

  return (
    <View
      style={[styles.suggestionItem, { borderColor: colors.borderLight }]}
      accessibilityRole="none"
    >
      <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
      <View style={styles.suggestionContent}>
        <Text style={[TextStyles.labelSemibold, { color: colors.text }]}>
          {suggestion.title}
        </Text>
        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {suggestion.description}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  contentDesktop: {
    maxWidth: 920,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  refreshIndicator: {
    marginLeft: Spacing.xs,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },

  // Period Selector
  periodContainer: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  periodTab: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    // backgroundColor set inline
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricsGridMobile: {
    // On mobile, 2 columns
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card (shared)
  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },

  // Engagement Score
  engagementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreCircleContainer: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryComparison: {
    alignItems: 'center',
  },
  engagementBar: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  engagementBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },

  // Traffic Sources
  trafficList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  trafficRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trafficLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  trafficBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trafficBar: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  trafficBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },

  // Keywords
  keywordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  keywordHeader: {
    marginTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },

  // Suggestions
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  suggestionContent: {
    flex: 1,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
