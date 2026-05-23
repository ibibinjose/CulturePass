"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostProfileFormDataSchema = exports.HostProfileSchema = exports.ProfessionalDataSchema = exports.RateCardTierSchema = exports.ArtistDataSchema = exports.AvailabilityDateSchema = exports.PortfolioItemSchema = exports.BusinessDataSchema = exports.PaymentMethodSchema = exports.CatalogueItemSchema = exports.VenueDataSchema = exports.AccessibilityFeaturesSchema = exports.ExceptionDateSchema = exports.RecurringScheduleSchema = exports.TimeRangeSchema = exports.TechnicalSpecsSchema = exports.OrganiserDataSchema = exports.PastEventSchema = exports.CommunityDataSchema = exports.GrowthDataPointSchema = exports.LicenceSchema = exports.AddressSchema = exports.SocialLinkSchema = exports.HostEntityTypeSchema = void 0;
var zod_1 = require("zod");
// ============================================================================
// HostSpace Enterprise-Grade Form System - Profile Schema
// ============================================================================
// This schema defines the data models for the unified host profile creation
// system supporting six entity types: community, organiser, venue, business,
// artist, and professional.
//
// Related: requirements.md (Requirements 6-17), design.md (Data Models)
// ============================================================================
// Entity Types
exports.HostEntityTypeSchema = zod_1.z.enum([
    'community',
    'organiser',
    'venue',
    'business',
    'artist',
    'professional',
]);
// Social Link
exports.SocialLinkSchema = zod_1.z.object({
    platform: zod_1.z.enum([
        'facebook',
        'instagram',
        'twitter',
        'linkedin',
        'tiktok',
        'youtube',
        'website',
        'other',
    ]),
    url: zod_1.z.string().url(),
    verified: zod_1.z.boolean().default(false),
    metadata: zod_1.z
        .object({
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        image: zod_1.z.string().url(),
    })
        .optional(),
});
// Address
exports.AddressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().min(1),
    postcode: zod_1.z.string().min(1),
    country: zod_1.z.string().min(1),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    lgaCode: zod_1.z.string().optional(),
    placeId: zod_1.z.string().optional(),
    isPrimary: zod_1.z.boolean().default(false),
});
// Licence
exports.LicenceSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    number: zod_1.z.string().min(1),
    documentUrl: zod_1.z.string().url(),
    expiryDate: zod_1.z.string().optional(), // ISO 8601
    verified: zod_1.z.boolean().default(false),
});
// ============================================================================
// Entity-Specific Data Models
// ============================================================================
// Community Data
exports.GrowthDataPointSchema = zod_1.z.object({
    date: zod_1.z.string(), // ISO 8601
    memberCount: zod_1.z.number().int().nonnegative(),
});
exports.CommunityDataSchema = zod_1.z.object({
    membershipModel: zod_1.z.enum(['free', 'paid', 'invite-only']),
    monthlyFee: zod_1.z.number().int().nonnegative().optional(), // cents
    membershipCount: zod_1.z.number().int().nonnegative().default(0),
    growthData: zod_1.z.array(exports.GrowthDataPointSchema).default([]),
    guidelines: zod_1.z.string(), // Rich text HTML
    communityLogoUrl: zod_1.z.string().url().optional(),
    communityBannerUrl: zod_1.z.string().url().optional(),
});
// Organiser Data
exports.PastEventSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    date: zod_1.z.string(), // ISO 8601
    venue: zod_1.z.string().min(1),
    attendance: zod_1.z.number().int().nonnegative(),
    culturePassEventId: zod_1.z.string().optional(),
});
exports.OrganiserDataSchema = zod_1.z.object({
    pastEvents: zod_1.z.array(exports.PastEventSchema).default([]),
    insuranceCertificate: zod_1.z
        .object({
        documentUrl: zod_1.z.string().url(),
        expiryDate: zod_1.z.string(), // ISO 8601
        verified: zod_1.z.boolean().default(false),
    })
        .optional(),
    producerCredentials: zod_1.z.string().default(''),
    credentialDocuments: zod_1.z.array(zod_1.z.string().url()).default([]),
    eventsHostedCount: zod_1.z.number().int().nonnegative().default(0),
    totalAttendance: zod_1.z.number().int().nonnegative().default(0),
});
// Venue Data
exports.TechnicalSpecsSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.string().optional());
exports.TimeRangeSchema = zod_1.z.object({
    open: zod_1.z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
    close: zod_1.z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
});
exports.RecurringScheduleSchema = zod_1.z.object({
    monday: exports.TimeRangeSchema.optional(),
    tuesday: exports.TimeRangeSchema.optional(),
    wednesday: exports.TimeRangeSchema.optional(),
    thursday: exports.TimeRangeSchema.optional(),
    friday: exports.TimeRangeSchema.optional(),
    saturday: exports.TimeRangeSchema.optional(),
    sunday: exports.TimeRangeSchema.optional(),
});
exports.ExceptionDateSchema = zod_1.z.object({
    date: zod_1.z.string(), // ISO 8601
    reason: zod_1.z.string().min(1),
    closed: zod_1.z.boolean(),
});
exports.AccessibilityFeaturesSchema = zod_1.z.object({
    wheelchairAccess: zod_1.z.boolean().default(false),
    accessibleParking: zod_1.z.boolean().default(false),
    accessibleToilets: zod_1.z.boolean().default(false),
    hearingLoop: zod_1.z.boolean().default(false),
    brailleSignage: zod_1.z.boolean().default(false),
    serviceAnimalFriendly: zod_1.z.boolean().default(false),
});
exports.VenueDataSchema = zod_1.z.object({
    capacity: zod_1.z.object({
        seated: zod_1.z.number().int().nonnegative(),
        standing: zod_1.z.number().int().nonnegative(),
        fireSafetyMax: zod_1.z.number().int().nonnegative(),
    }),
    technicalRider: zod_1.z.object({
        documentUrl: zod_1.z.string().url(),
        parsedSpecs: exports.TechnicalSpecsSchema.default({}),
    }),
    openingHours: exports.RecurringScheduleSchema,
    exceptionDates: zod_1.z.array(exports.ExceptionDateSchema).default([]),
    parking: zod_1.z.object({
        available: zod_1.z.boolean(),
        capacity: zod_1.z.number().int().nonnegative().optional(),
        cost: zod_1.z.string().optional(),
    }),
    evCharging: zod_1.z.boolean().default(false),
    publicTransport: zod_1.z.object({
        nearestStation: zod_1.z.string().min(1),
        walkingDistance: zod_1.z.string().min(1),
    }),
    accessibility: exports.AccessibilityFeaturesSchema,
    accessibilityScore: zod_1.z.number().min(0).max(100).default(0),
});
// Business Data
exports.CatalogueItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    price: zod_1.z.number().int().nonnegative(), // cents
    imageUrl: zod_1.z.string().url().optional(),
});
exports.PaymentMethodSchema = zod_1.z.enum([
    'cash',
    'card',
    'digital-wallet',
    'bank-transfer',
    'crypto',
]);
exports.BusinessDataSchema = zod_1.z.object({
    catalogue: zod_1.z.array(exports.CatalogueItemSchema).max(20).default([]),
    priceRange: zod_1.z.enum(['budget', 'moderate', 'premium', 'luxury']),
    paymentMethods: zod_1.z.array(exports.PaymentMethodSchema).min(1),
    businessHours: exports.RecurringScheduleSchema,
    holidayCalendar: zod_1.z.array(exports.ExceptionDateSchema).default([]),
    partners: zod_1.z.array(zod_1.z.string()).default([]), // Profile IDs
    category: zod_1.z.string().min(1),
});
// Artist Data
exports.PortfolioItemSchema = zod_1.z.object({
    type: zod_1.z.enum(['image', 'video']),
    url: zod_1.z.string().url(),
    caption: zod_1.z.string().optional(),
    order: zod_1.z.number().int().nonnegative(),
});
exports.AvailabilityDateSchema = zod_1.z.object({
    date: zod_1.z.string(), // ISO 8601
    status: zod_1.z.enum(['available', 'booked', 'unavailable']),
});
exports.ArtistDataSchema = zod_1.z.object({
    portfolio: zod_1.z.array(exports.PortfolioItemSchema).min(3).max(20),
    genres: zod_1.z.array(zod_1.z.string()).min(1),
    representation: zod_1.z
        .object({
        name: zod_1.z.string().min(1),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().min(1),
    })
        .optional(),
    availabilityCalendar: zod_1.z.array(exports.AvailabilityDateSchema).default([]),
    bookingLeadTime: zod_1.z.number().int().nonnegative(), // days
});
// Professional Data
exports.RateCardTierSchema = zod_1.z.object({
    type: zod_1.z.enum(['hourly', 'project-based', 'sponsorship']),
    rate: zod_1.z.number().nonnegative(), // in selected currency
    description: zod_1.z.string().optional(),
});
exports.ProfessionalDataSchema = zod_1.z.object({
    credentials: zod_1.z.array(zod_1.z.string().url()).default([]), // Document URLs
    credentialsVerified: zod_1.z.boolean().default(false),
    influencerLicence: zod_1.z
        .object({
        platform: zod_1.z.string().min(1),
        handle: zod_1.z.string().min(1),
        followerCount: zod_1.z.number().int().nonnegative(),
        verified: zod_1.z.boolean().default(false),
    })
        .optional(),
    expertiseAreas: zod_1.z.array(zod_1.z.string()).min(1),
    availabilityStatus: zod_1.z.enum(['available', 'not-available', 'by-request']),
    rateCard: zod_1.z.array(exports.RateCardTierSchema).min(1),
    currency: zod_1.z.enum(['AUD', 'USD', 'GBP', 'EUR', 'NZD', 'AED']),
    responseTime: zod_1.z.enum(['24-hours', '2-3-days', '1-week']),
});
// ============================================================================
// Main Profile Schema
// ============================================================================
exports.HostProfileSchema = zod_1.z.object({
    // Core Identity
    id: zod_1.z.string(),
    entityType: exports.HostEntityTypeSchema,
    ownerId: zod_1.z.string(), // Firebase Auth UID
    handle: zod_1.z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-z0-9-]+$/),
    officialName: zod_1.z.string().min(2).max(120),
    tradingName: zod_1.z.string().min(2).max(120).optional(),
    foundingDate: zod_1.z.string(), // ISO 8601
    // Media
    logoUrl: zod_1.z.string().url(),
    heroImageUrl: zod_1.z.string().url(),
    galleryImages: zod_1.z.array(zod_1.z.string().url()).max(12).default([]),
    videoUrl: zod_1.z.string().url().optional(),
    // Contact
    publicEmail: zod_1.z.string().email(),
    emailVerified: zod_1.z.boolean().default(false),
    phoneNumber: zod_1.z.string().min(1),
    phoneVerified: zod_1.z.boolean().default(false),
    whatsappNumber: zod_1.z.string().optional(),
    socialLinks: zod_1.z.array(exports.SocialLinkSchema).max(8).default([]),
    primaryContactMethod: zod_1.z.enum(['email', 'phone', 'whatsapp']),
    // Location
    primaryAddress: exports.AddressSchema,
    additionalLocations: zod_1.z.array(exports.AddressSchema).default([]),
    isOnlineOnly: zod_1.z.boolean().default(false),
    lgaCode: zod_1.z.string().optional(),
    // Description & SEO
    tagline: zod_1.z.string().max(120),
    description: zod_1.z.string().min(1), // Rich text HTML
    categoryTags: zod_1.z.array(zod_1.z.string()).min(3).max(10),
    metaDescription: zod_1.z.string().max(160), // Auto-generated
    // Legal & Compliance
    abn: zod_1.z.string().optional(),
    acn: zod_1.z.string().optional(),
    gstRegistered: zod_1.z.boolean().default(false),
    gstId: zod_1.z.string().optional(),
    licences: zod_1.z.array(exports.LicenceSchema).default([]),
    verificationStatus: zod_1.z.enum(['pending', 'verified', 'rejected']).default('pending'),
    verificationNotes: zod_1.z.string().optional(),
    // Entity-Specific Data
    communityData: exports.CommunityDataSchema.optional(),
    organiserData: exports.OrganiserDataSchema.optional(),
    venueData: exports.VenueDataSchema.optional(),
    businessData: exports.BusinessDataSchema.optional(),
    artistData: exports.ArtistDataSchema.optional(),
    professionalData: exports.ProfessionalDataSchema.optional(),
    // Metadata
    status: zod_1.z.enum(['draft', 'published', 'pending_verification', 'suspended']).default('draft'),
    createdAt: zod_1.z.string(), // ISO 8601 timestamp
    updatedAt: zod_1.z.string(), // ISO 8601 timestamp
    publishedAt: zod_1.z.string().optional(), // ISO 8601 timestamp
    lastModifiedBy: zod_1.z.string(),
    // Analytics
    viewCount: zod_1.z.number().int().nonnegative().default(0),
    uniqueVisitorCount: zod_1.z.number().int().nonnegative().default(0),
    contactClickCount: zod_1.z.number().int().nonnegative().default(0),
    searchAppearances: zod_1.z.number().int().nonnegative().default(0),
    engagementScore: zod_1.z.number().nonnegative().default(0),
});
// Partial schema for form data (all fields optional except entityType)
exports.HostProfileFormDataSchema = exports.HostProfileSchema.partial().required({
    entityType: true,
});
