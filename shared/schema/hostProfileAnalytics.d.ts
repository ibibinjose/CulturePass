import { z } from 'zod';
export declare const KeywordMetricSchema: z.ZodObject<{
    keyword: z.ZodString;
    impressions: z.ZodNumber;
    clicks: z.ZodNumber;
    ctr: z.ZodNumber;
}, z.core.$strip>;
export type KeywordMetric = z.infer<typeof KeywordMetricSchema>;
export declare const ProfileAnalyticsSchema: z.ZodObject<{
    profileId: z.ZodString;
    period: z.ZodEnum<{
        weekly: "weekly";
        monthly: "monthly";
        daily: "daily";
        "all-time": "all-time";
    }>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    metrics: z.ZodObject<{
        views: z.ZodNumber;
        uniqueVisitors: z.ZodNumber;
        contactClicks: z.ZodNumber;
        socialLinkClicks: z.ZodRecord<z.ZodString, z.ZodNumber>;
        searchAppearances: z.ZodNumber;
        searchClickThroughRate: z.ZodNumber;
    }, z.core.$strip>;
    trafficSources: z.ZodObject<{
        direct: z.ZodNumber;
        search: z.ZodNumber;
        social: z.ZodNumber;
        referral: z.ZodNumber;
    }, z.core.$strip>;
    topKeywords: z.ZodDefault<z.ZodArray<z.ZodObject<{
        keyword: z.ZodString;
        impressions: z.ZodNumber;
        clicks: z.ZodNumber;
        ctr: z.ZodNumber;
    }, z.core.$strip>>>;
    engagementScore: z.ZodNumber;
    categoryRank: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type ProfileAnalytics = z.infer<typeof ProfileAnalyticsSchema>;
export declare const ProfileAnalyticsQuerySchema: z.ZodObject<{
    profileId: z.ZodString;
    period: z.ZodDefault<z.ZodEnum<{
        weekly: "weekly";
        monthly: "monthly";
        daily: "daily";
        "all-time": "all-time";
    }>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ProfileAnalyticsQuery = z.infer<typeof ProfileAnalyticsQuerySchema>;
export declare const ProfileAnalyticsComparisonSchema: z.ZodObject<{
    profileId: z.ZodString;
    period: z.ZodEnum<{
        weekly: "weekly";
        monthly: "monthly";
        daily: "daily";
        "all-time": "all-time";
    }>;
    currentMetrics: z.ZodObject<{
        profileId: z.ZodString;
        period: z.ZodEnum<{
            weekly: "weekly";
            monthly: "monthly";
            daily: "daily";
            "all-time": "all-time";
        }>;
        startDate: z.ZodString;
        endDate: z.ZodString;
        metrics: z.ZodObject<{
            views: z.ZodNumber;
            uniqueVisitors: z.ZodNumber;
            contactClicks: z.ZodNumber;
            socialLinkClicks: z.ZodRecord<z.ZodString, z.ZodNumber>;
            searchAppearances: z.ZodNumber;
            searchClickThroughRate: z.ZodNumber;
        }, z.core.$strip>;
        trafficSources: z.ZodObject<{
            direct: z.ZodNumber;
            search: z.ZodNumber;
            social: z.ZodNumber;
            referral: z.ZodNumber;
        }, z.core.$strip>;
        topKeywords: z.ZodDefault<z.ZodArray<z.ZodObject<{
            keyword: z.ZodString;
            impressions: z.ZodNumber;
            clicks: z.ZodNumber;
            ctr: z.ZodNumber;
        }, z.core.$strip>>>;
        engagementScore: z.ZodNumber;
        categoryRank: z.ZodOptional<z.ZodNumber>;
        updatedAt: z.ZodString;
    }, z.core.$strip>;
    categoryAverage: z.ZodObject<{
        views: z.ZodNumber;
        uniqueVisitors: z.ZodNumber;
        contactClicks: z.ZodNumber;
        engagementScore: z.ZodNumber;
    }, z.core.$strip>;
    percentile: z.ZodNumber;
}, z.core.$strip>;
export type ProfileAnalyticsComparison = z.infer<typeof ProfileAnalyticsComparisonSchema>;
//# sourceMappingURL=hostProfileAnalytics.d.ts.map