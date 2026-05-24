import { z } from 'zod';

// ============================================================================
// HostSpace Enterprise-Grade Form System - Profile Analytics Schema
// ============================================================================
// This schema defines the data model for post-publish analytics tracking
// profile performance and engagement metrics.
//
// Related: requirements.md (Requirement 20), design.md (ProfileAnalytics)
// ============================================================================

export const KeywordMetricSchema = z.object({
  keyword: z.string().min(1),
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  ctr: z.number().min(0).max(1), // Click-through rate (0-1)
});

export type KeywordMetric = z.infer<typeof KeywordMetricSchema>;

export const ProfileAnalyticsSchema = z.object({
  profileId: z.string(),
  period: z.enum(['daily', 'weekly', 'monthly', 'all-time']),
  startDate: z.string(), // ISO 8601
  endDate: z.string(), // ISO 8601

  metrics: z.object({
    views: z.number().int().nonnegative(),
    uniqueVisitors: z.number().int().nonnegative(),
    contactClicks: z.number().int().nonnegative(),
    socialLinkClicks: z.record(z.string(), z.number().int().nonnegative()),
    searchAppearances: z.number().int().nonnegative(),
    searchClickThroughRate: z.number().min(0).max(1),
  }),

  trafficSources: z.object({
    direct: z.number().int().nonnegative(),
    search: z.number().int().nonnegative(),
    social: z.number().int().nonnegative(),
    referral: z.number().int().nonnegative(),
  }),

  topKeywords: z.array(KeywordMetricSchema).default([]),
  engagementScore: z.number().nonnegative(),
  categoryRank: z.number().int().positive().optional(), // Rank within same category

  updatedAt: z.string(), // ISO 8601 timestamp
});

export type ProfileAnalytics = z.infer<typeof ProfileAnalyticsSchema>;

// Schema for analytics query parameters
export const ProfileAnalyticsQuerySchema = z.object({
  profileId: z.string(),
  period: z.enum(['daily', 'weekly', 'monthly', 'all-time']).default('weekly'),
  startDate: z.string().optional(), // ISO 8601
  endDate: z.string().optional(), // ISO 8601
});

export type ProfileAnalyticsQuery = z.infer<typeof ProfileAnalyticsQuerySchema>;

// Schema for analytics comparison (compare to similar profiles)
export const ProfileAnalyticsComparisonSchema = z.object({
  profileId: z.string(),
  period: z.enum(['daily', 'weekly', 'monthly', 'all-time']),
  currentMetrics: ProfileAnalyticsSchema,
  categoryAverage: z.object({
    views: z.number().nonnegative(),
    uniqueVisitors: z.number().nonnegative(),
    contactClicks: z.number().nonnegative(),
    engagementScore: z.number().nonnegative(),
  }),
  percentile: z.number().min(0).max(100), // Where this profile ranks (0-100)
});

export type ProfileAnalyticsComparison = z.infer<typeof ProfileAnalyticsComparisonSchema>;
