import { z } from 'zod';
import { HostEntityTypeSchema } from './hostTypes';

// Social Link
export const SocialLinkSchema = z.object({
  platform: z.enum([
    'facebook',
    'instagram',
    'twitter',
    'linkedin',
    'tiktok',
    'youtube',
    'website',
    'other',
  ]),
  url: z.string().url(),
  verified: z.boolean().default(false),
  metadata: z
    .object({
      title: z.string(),
      description: z.string(),
      image: z.string().url(),
    })
    .optional(),
});

export type SocialLink = z.infer<typeof SocialLinkSchema>;

// Address
export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postcode: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  lgaCode: z.string().optional(),
  placeId: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export type Address = z.infer<typeof AddressSchema>;

// Licence
export const LicenceSchema = z.object({
  type: z.string().min(1),
  number: z.string().min(1),
  documentUrl: z.string().url(),
  expiryDate: z.string().optional(), // ISO 8601
  verified: z.boolean().default(false),
});

export type Licence = z.infer<typeof LicenceSchema>;

// ============================================================================
// Entity-Specific Data Models
// ============================================================================

// Community Data
export const GrowthDataPointSchema = z.object({
  date: z.string(), // ISO 8601
  memberCount: z.number().int().nonnegative(),
});

export const CommunityDataSchema = z.object({
  membershipModel: z.enum(['free', 'paid', 'invite-only']),
  monthlyFee: z.number().int().nonnegative().optional(), // cents
  membershipCount: z.number().int().nonnegative().default(0),
  growthData: z.array(GrowthDataPointSchema).default([]),
  guidelines: z.string(), // Rich text HTML
  communityLogoUrl: z.string().url().optional(),
  communityBannerUrl: z.string().url().optional(),
});

export type CommunityData = z.infer<typeof CommunityDataSchema>;
export type GrowthDataPoint = z.infer<typeof GrowthDataPointSchema>;

// Organiser Data
export const PastEventSchema = z.object({
  name: z.string().min(1),
  date: z.string(), // ISO 8601
  venue: z.string().min(1),
  attendance: z.number().int().nonnegative(),
  culturePassEventId: z.string().optional(),
});

export const OrganiserDataSchema = z.object({
  pastEvents: z.array(PastEventSchema).default([]),
  insuranceCertificate: z
    .object({
      documentUrl: z.string().url(),
      expiryDate: z.string(), // ISO 8601
      verified: z.boolean().default(false),
    })
    .optional(),
  producerCredentials: z.string().default(''),
  credentialDocuments: z.array(z.string().url()).default([]),
  eventsHostedCount: z.number().int().nonnegative().default(0),
  totalAttendance: z.number().int().nonnegative().default(0),
});

export type OrganiserData = z.infer<typeof OrganiserDataSchema>;
export type PastEvent = z.infer<typeof PastEventSchema>;

// Venue Data
export const TechnicalSpecsSchema = z.record(z.string(), z.string().optional());

export const TimeRangeSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  close: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
});

export const RecurringScheduleSchema = z.object({
  monday: TimeRangeSchema.optional(),
  tuesday: TimeRangeSchema.optional(),
  wednesday: TimeRangeSchema.optional(),
  thursday: TimeRangeSchema.optional(),
  friday: TimeRangeSchema.optional(),
  saturday: TimeRangeSchema.optional(),
  sunday: TimeRangeSchema.optional(),
});

export const ExceptionDateSchema = z.object({
  date: z.string(), // ISO 8601
  reason: z.string().min(1),
  closed: z.boolean(),
});

export const AccessibilityFeaturesSchema = z.object({
  wheelchairAccess: z.boolean().default(false),
  accessibleParking: z.boolean().default(false),
  accessibleToilets: z.boolean().default(false),
  hearingLoop: z.boolean().default(false),
  brailleSignage: z.boolean().default(false),
  serviceAnimalFriendly: z.boolean().default(false),
});

export const VenueDataSchema = z.object({
  capacity: z.object({
    seated: z.number().int().nonnegative(),
    standing: z.number().int().nonnegative(),
    fireSafetyMax: z.number().int().nonnegative(),
  }),
  technicalRider: z.object({
    documentUrl: z.string().url(),
    parsedSpecs: TechnicalSpecsSchema.default({}),
  }),
  openingHours: RecurringScheduleSchema,
  exceptionDates: z.array(ExceptionDateSchema).default([]),
  parking: z.object({
    available: z.boolean(),
    capacity: z.number().int().nonnegative().optional(),
    cost: z.string().optional(),
  }),
  evCharging: z.boolean().default(false),
  publicTransport: z.object({
    nearestStation: z.string().min(1),
    walkingDistance: z.string().min(1),
  }),
  accessibility: AccessibilityFeaturesSchema,
  accessibilityScore: z.number().min(0).max(100).default(0),
});

export type VenueData = z.infer<typeof VenueDataSchema>;
export type TechnicalSpecs = z.infer<typeof TechnicalSpecsSchema>;
export type TimeRange = z.infer<typeof TimeRangeSchema>;
export type RecurringSchedule = z.infer<typeof RecurringScheduleSchema>;
export type ExceptionDate = z.infer<typeof ExceptionDateSchema>;
export type AccessibilityFeatures = z.infer<typeof AccessibilityFeaturesSchema>;

// Business Data
export const CatalogueItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().nonnegative(), // cents
  imageUrl: z.string().url().optional(),
});

export const PaymentMethodSchema = z.enum([
  'cash',
  'card',
  'digital-wallet',
  'bank-transfer',
  'crypto',
]);

export const BusinessDataSchema = z.object({
  catalogue: z.array(CatalogueItemSchema).max(20).default([]),
  priceRange: z.enum(['budget', 'moderate', 'premium', 'luxury']),
  paymentMethods: z.array(PaymentMethodSchema).min(1),
  businessHours: RecurringScheduleSchema,
  holidayCalendar: z.array(ExceptionDateSchema).default([]),
  partners: z.array(z.string()).default([]), // Profile IDs
  category: z.string().min(1),
});

export type BusinessData = z.infer<typeof BusinessDataSchema>;
export type CatalogueItem = z.infer<typeof CatalogueItemSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Artist Data
export const PortfolioItemSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().url(),
  caption: z.string().optional(),
  order: z.number().int().nonnegative(),
});

export const AvailabilityDateSchema = z.object({
  date: z.string(), // ISO 8601
  status: z.enum(['available', 'booked', 'unavailable']),
});

export const ArtistDataSchema = z.object({
  portfolio: z.array(PortfolioItemSchema).min(3).max(20),
  genres: z.array(z.string()).min(1),
  representation: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
    })
    .optional(),
  availabilityCalendar: z.array(AvailabilityDateSchema).default([]),
  bookingLeadTime: z.number().int().nonnegative(), // days
});

export type ArtistData = z.infer<typeof ArtistDataSchema>;
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type AvailabilityDate = z.infer<typeof AvailabilityDateSchema>;

// Professional Data
export const RateCardTierSchema = z.object({
  type: z.enum(['hourly', 'project-based', 'sponsorship']),
  rate: z.number().nonnegative(), // in selected currency
  description: z.string().optional(),
});

export const ProfessionalDataSchema = z.object({
  credentials: z.array(z.string().url()).default([]), // Document URLs
  credentialsVerified: z.boolean().default(false),
  influencerLicence: z
    .object({
      platform: z.string().min(1),
      handle: z.string().min(1),
      followerCount: z.number().int().nonnegative(),
      verified: z.boolean().default(false),
    })
    .optional(),
  expertiseAreas: z.array(z.string()).min(1),
  availabilityStatus: z.enum(['available', 'not-available', 'by-request']),
  rateCard: z.array(RateCardTierSchema).min(1),
  currency: z.enum(['AUD', 'USD', 'GBP', 'EUR', 'NZD', 'AED']),
  responseTime: z.enum(['24-hours', '2-3-days', '1-week']),
});

export type ProfessionalData = z.infer<typeof ProfessionalDataSchema>;
export type RateCardTier = z.infer<typeof RateCardTierSchema>;

// ============================================================================
// Main Profile Schema
// ============================================================================

export const HostProfileSchema = z.object({
  // Core Identity
  id: z.string(),
  entityType: HostEntityTypeSchema,
  ownerId: z.string(), // Firebase Auth UID
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/),
  officialName: z.string().min(2).max(120),
  tradingName: z.string().min(2).max(120).optional(),
  foundingDate: z.string(), // ISO 8601

  // Media
  logoUrl: z.string().url(),
  heroImageUrl: z.string().url(),
  galleryImages: z.array(z.string().url()).max(12).default([]),
  videoUrl: z.string().url().optional(),

  // Contact
  publicEmail: z.string().email(),
  emailVerified: z.boolean().default(false),
  phoneNumber: z.string().min(1),
  phoneVerified: z.boolean().default(false),
  whatsappNumber: z.string().optional(),
  socialLinks: z.array(SocialLinkSchema).max(8).default([]),
  primaryContactMethod: z.enum(['email', 'phone', 'whatsapp']),

  // Location
  primaryAddress: AddressSchema,
  additionalLocations: z.array(AddressSchema).default([]),
  isOnlineOnly: z.boolean().default(false),
  lgaCode: z.string().optional(),

  // Description & SEO
  tagline: z.string().max(120),
  description: z.string().min(1), // Rich text HTML
  categoryTags: z.array(z.string()).min(3).max(10),
  metaDescription: z.string().max(160), // Auto-generated

  // Legal & Compliance
  abn: z.string().optional(),
  acn: z.string().optional(),
  gstRegistered: z.boolean().default(false),
  gstId: z.string().optional(),
  licences: z.array(LicenceSchema).default([]),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending'),
  verificationNotes: z.string().optional(),

  // Entity-Specific Data
  communityData: CommunityDataSchema.optional(),
  organiserData: OrganiserDataSchema.optional(),
  venueData: VenueDataSchema.optional(),
  businessData: BusinessDataSchema.optional(),
  artistData: ArtistDataSchema.optional(),
  professionalData: ProfessionalDataSchema.optional(),

  // Metadata
  status: z.enum(['draft', 'published', 'pending_verification', 'suspended']).default('draft'),
  createdAt: z.string(), // ISO 8601 timestamp
  updatedAt: z.string(), // ISO 8601 timestamp
  publishedAt: z.string().optional(), // ISO 8601 timestamp
  lastModifiedBy: z.string(),

  // Analytics
  viewCount: z.number().int().nonnegative().default(0),
  uniqueVisitorCount: z.number().int().nonnegative().default(0),
  contactClickCount: z.number().int().nonnegative().default(0),
  searchAppearances: z.number().int().nonnegative().default(0),
  engagementScore: z.number().nonnegative().default(0),
});

export type HostProfile = z.infer<typeof HostProfileSchema>;

// Partial schema for form data (all fields optional except entityType)
export const HostProfileFormDataSchema = HostProfileSchema.partial().required({
  entityType: true,
});

export type HostProfileFormData = z.infer<typeof HostProfileFormDataSchema>;
