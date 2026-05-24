"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileAnalyticsComparisonSchema = exports.ProfileAnalyticsQuerySchema = exports.ProfileAnalyticsSchema = exports.KeywordMetricSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// HostSpace Enterprise-Grade Form System - Profile Analytics Schema
// ============================================================================
// This schema defines the data model for post-publish analytics tracking
// profile performance and engagement metrics.
//
// Related: requirements.md (Requirement 20), design.md (ProfileAnalytics)
// ============================================================================
exports.KeywordMetricSchema = zod_1.z.object({
    keyword: zod_1.z.string().min(1),
    impressions: zod_1.z.number().int().nonnegative(),
    clicks: zod_1.z.number().int().nonnegative(),
    ctr: zod_1.z.number().min(0).max(1), // Click-through rate (0-1)
});
exports.ProfileAnalyticsSchema = zod_1.z.object({
    profileId: zod_1.z.string(),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'all-time']),
    startDate: zod_1.z.string(), // ISO 8601
    endDate: zod_1.z.string(), // ISO 8601
    metrics: zod_1.z.object({
        views: zod_1.z.number().int().nonnegative(),
        uniqueVisitors: zod_1.z.number().int().nonnegative(),
        contactClicks: zod_1.z.number().int().nonnegative(),
        socialLinkClicks: zod_1.z.record(zod_1.z.string(), zod_1.z.number().int().nonnegative()),
        searchAppearances: zod_1.z.number().int().nonnegative(),
        searchClickThroughRate: zod_1.z.number().min(0).max(1),
    }),
    trafficSources: zod_1.z.object({
        direct: zod_1.z.number().int().nonnegative(),
        search: zod_1.z.number().int().nonnegative(),
        social: zod_1.z.number().int().nonnegative(),
        referral: zod_1.z.number().int().nonnegative(),
    }),
    topKeywords: zod_1.z.array(exports.KeywordMetricSchema).default([]),
    engagementScore: zod_1.z.number().nonnegative(),
    categoryRank: zod_1.z.number().int().positive().optional(), // Rank within same category
    updatedAt: zod_1.z.string(), // ISO 8601 timestamp
});
// Schema for analytics query parameters
exports.ProfileAnalyticsQuerySchema = zod_1.z.object({
    profileId: zod_1.z.string(),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'all-time']).default('weekly'),
    startDate: zod_1.z.string().optional(), // ISO 8601
    endDate: zod_1.z.string().optional(), // ISO 8601
});
// Schema for analytics comparison (compare to similar profiles)
exports.ProfileAnalyticsComparisonSchema = zod_1.z.object({
    profileId: zod_1.z.string(),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'all-time']),
    currentMetrics: exports.ProfileAnalyticsSchema,
    categoryAverage: zod_1.z.object({
        views: zod_1.z.number().nonnegative(),
        uniqueVisitors: zod_1.z.number().nonnegative(),
        contactClicks: zod_1.z.number().nonnegative(),
        engagementScore: zod_1.z.number().nonnegative(),
    }),
    percentile: zod_1.z.number().min(0).max(100), // Where this profile ranks (0-100)
});
//# sourceMappingURL=hostProfileAnalytics.js.map