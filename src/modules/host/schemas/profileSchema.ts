/**
 * Profile Form Validation Schemas
 * 
 * Zod schemas for validating host profile forms across all six entity types.
 * Used by the HostSpace Enterprise-Grade Form System for real-time validation
 * and step-by-step wizard validation.
 * 
 * Entity Types:
 * - community: Cultural groups with membership models
 * - organiser: Event producers with credentials
 * - venue: Physical spaces with capacity specs
 * - business: Commercial entities with catalogues
 * - artist: Performers with portfolios
 * - professional: Freelancers/experts/influencers
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Common Field Schemas
// ---------------------------------------------------------------------------

/**
 * Handle validation: lowercase alphanumeric with hyphens
 * Min 3, max 30 characters
 * No consecutive hyphens, no leading/trailing hyphens
 */
export const handleSchema = z
  .string()
  .min(3, 'Handle must be at least 3 characters')
  .max(30, 'Handle must be at most 30 characters')
  .regex(/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens')
  .regex(/^[a-z0-9]/, 'Handle must start with a letter or number')
  .regex(/[a-z0-9]$/, 'Handle must end with a letter or number')
  .regex(/^(?!.*--)/,'Handle cannot contain consecutive hyphens');

/**
 * Official name validation: 2-120 characters
 */
export const officialNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(120, 'Name must be at most 120 characters')
  .trim();

/**
 * Email validation: RFC 5322 compliant
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase();

/**
 * Phone validation: E.164 international format
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (e.g., +61412345678)');

/**
 * URL validation: HTTPS required
 */
export const urlSchema = z
  .string()
  .url('Invalid URL')
  .refine((url) => url.startsWith('https://'), 'URL must use HTTPS');

/**
 * Image URL validation: checks format and dimensions
 */
export const imageUrlSchema = z
  .string()
  .url('Invalid image URL')
  .refine(
    (url) => {
      // For Firebase Storage URLs and others with query params, check the path part
      const path = url.split('?')[0].split('#')[0];
      return /\.(jpg|jpeg|png|webp|gif)$/i.test(path);
    },
    'Image must be JPG, PNG, WebP, or GIF'
  );

/**
 * ABN validation: 11 digits with checksum
 */
export const abnSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.replace(/\s/g, '') : val),
  z
    .string()
    .refine((abn) => /^\d{11}$/.test(abn), 'ABN must be 11 digits')
    .refine((abn) => {
      // ABN checksum validation algorithm
      const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
      const digits = abn.split('').map(Number);
      digits[0] -= 1; // Subtract 1 from first digit
      const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
      return sum % 89 === 0;
    }, 'Invalid ABN checksum')
);

/**
 * Date validation: ISO 8601 format, not in future
 */
export const pastDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => new Date(date) <= new Date(), 'Date cannot be in the future');

/**
 * Tagline validation: 1-120 characters
 */
export const taglineSchema = z
  .string()
  .min(1, 'Tagline is required')
  .max(120, 'Tagline must be at most 120 characters')
  .trim();

/**
 * Rich text description: 100-5000 characters
 */
export const descriptionSchema = z
  .string()
  .min(100, 'Description must be at least 100 characters')
  .max(5000, 'Description must be at most 5000 characters')
  .trim();

// ---------------------------------------------------------------------------
// Address Schema
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().min(1, 'Country is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  lgaCode: z.string().optional(),
  placeId: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Social Links Schema
// ---------------------------------------------------------------------------

export const socialLinkSchema = z.object({
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
  url: urlSchema,
  verified: z.boolean().default(false),
  metadata: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Licence Schema
// ---------------------------------------------------------------------------

export const licenceSchema = z.object({
  type: z.string().min(1, 'Licence type is required'),
  number: z.string().min(1, 'Licence number is required'),
  documentUrl: z.string().url('Invalid document URL'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  verified: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Step 1: Basic Identity Schema
// ---------------------------------------------------------------------------

export const step1IdentitySchema = z.object({
  officialName: officialNameSchema,
  handle: handleSchema,
  tradingName: z.string().max(120).optional(),
  foundingDate: pastDateSchema,
  entityType: z.enum(['community', 'organiser', 'venue', 'business', 'artist', 'professional']),
});

// ---------------------------------------------------------------------------
// Step 2: Media & Branding Schema
// ---------------------------------------------------------------------------

export const step2MediaSchema = z.object({
  logoUrl: imageUrlSchema,
  heroImageUrl: imageUrlSchema,
  galleryImages: z.array(imageUrlSchema).max(12, 'Maximum 12 gallery images'),
  videoUrl: urlSchema.optional(),
});

// ---------------------------------------------------------------------------
// Step 3: Legal & Compliance Schema
// ---------------------------------------------------------------------------

export const step3LegalBaseSchema = z.object({
  publicEmail: emailSchema,
  emailVerified: z.boolean().default(false),
  phoneNumber: phoneSchema,
  phoneVerified: z.boolean().default(false),
  whatsappNumber: phoneSchema.optional(),
  gstRegistered: z.boolean().default(false),
  gstId: z.string().optional(),
  licences: z.array(licenceSchema).default([]),
});

// Entity-specific legal schemas
export const step3LegalBusinessSchema = step3LegalBaseSchema.extend({
  abn: abnSchema,
});

export const step3LegalOrganiserSchema = step3LegalBaseSchema.extend({
  abn: abnSchema.optional().or(z.literal('')),
});

export const step3LegalVenueSchema = step3LegalBaseSchema.extend({
  abn: abnSchema,
});

export const step3LegalProfessionalSchema = step3LegalBaseSchema.extend({
  influencerLicence: z
    .object({
      platform: z.string(),
      handle: z.string(),
      followerCount: z.number().min(10000, 'Minimum 10,000 followers required for influencer verification'),
      verified: z.boolean().default(false),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Step 4: Location & Operations Schema
// ---------------------------------------------------------------------------

export const step4LocationSchema = z.object({
  primaryAddress: addressSchema,
  additionalLocations: z.array(addressSchema).max(10, 'Maximum 10 additional locations'),
  isOnlineOnly: z.boolean().default(false),
  socialLinks: z.array(socialLinkSchema).max(8, 'Maximum 8 social links'),
  primaryContactMethod: z.enum(['email', 'phone', 'whatsapp']).default('email'),
});

// ---------------------------------------------------------------------------
// Step 5: Rich Description Schema
// ---------------------------------------------------------------------------

export const step5DescriptionSchema = z.object({
  tagline: taglineSchema,
  description: descriptionSchema,
  categoryTags: z
    .array(z.string())
    .min(3, 'Select at least 3 category tags')
    .max(10, 'Maximum 10 category tags'),
  indigenousTags: z.array(z.string().max(50)).max(10).optional(),
  metaDescription: z.string().max(160).optional(),
});

// ---------------------------------------------------------------------------
// Entity-Specific Data Schemas
// ---------------------------------------------------------------------------

/**
 * Community-specific fields
 */
export const communityDataSchema = z.object({
  membershipModel: z.enum(['free', 'paid', 'invite-only']),
  monthlyFee: z.number().min(0).optional(),
  membershipCount: z.number().min(0).default(0),
  growthData: z
    .array(
      z.object({
        date: z.string(),
        memberCount: z.number(),
      })
    )
    .default([]),
  guidelines: z.string().min(100).max(5000),
  communityLogoUrl: imageUrlSchema.optional(),
  communityBannerUrl: imageUrlSchema.optional(),
}).refine(
  (data) => {
    if (data.membershipModel === 'paid') {
      return data.monthlyFee !== undefined && data.monthlyFee > 0;
    }
    return true;
  },
  {
    message: 'Monthly fee is required for paid membership model',
    path: ['monthlyFee'],
  }
);

/**
 * Organiser-specific fields
 */
export const organiserDataSchema = z.object({
  pastEvents: z
    .array(
      z.object({
        name: z.string(),
        date: z.string(),
        venue: z.string(),
        attendance: z.number().min(0),
        culturePassEventId: z.string().optional(),
      })
    )
    .default([]),
  insuranceCertificate: z
    .object({
      documentUrl: z.string().url(),
      expiryDate: z.string(),
      verified: z.boolean().default(false),
    })
    .optional(),
  producerCredentials: z.string().max(1000).optional(),
  credentialDocuments: z.array(z.string().url()).default([]),
  eventsHostedCount: z.number().min(0).default(0),
  totalAttendance: z.number().min(0).default(0),
});

/**
 * Venue-specific fields
 */
export const venueDataSchema = z.object({
  capacity: z.object({
    seated: z.number().min(0),
    standing: z.number().min(0),
    fireSafetyMax: z.number().min(0),
  }).refine(
    (data) => data.fireSafetyMax >= Math.max(data.seated, data.standing),
    {
      message: 'Fire safety capacity must be greater than or equal to seated and standing capacities',
      path: ['fireSafetyMax'],
    }
  ),
  technicalRider: z.object({
    documentUrl: z.string().url(),
    parsedSpecs: z.record(z.string(), z.string()).default({}),
  }),
  openingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }),
  exceptionDates: z
    .array(
      z.object({
        date: z.string(),
        reason: z.string(),
        closed: z.boolean(),
      })
    )
    .default([]),
  parking: z.object({
    available: z.boolean(),
    capacity: z.number().min(0).optional(),
    cost: z.string().optional(),
  }),
  evCharging: z.boolean().default(false),
  publicTransport: z.object({
    nearestStation: z.string(),
    walkingDistance: z.string(),
  }),
  accessibility: z.object({
    wheelchairAccess: z.boolean().default(false),
    accessibleParking: z.boolean().default(false),
    accessibleToilets: z.boolean().default(false),
    hearingLoop: z.boolean().default(false),
    brailleSignage: z.boolean().default(false),
    serviceAnimalFriendly: z.boolean().default(false),
  }),
  accessibilityScore: z.number().min(0).max(100).default(0),
});

/**
 * Business-specific fields
 */
export const businessDataSchema = z.object({
  catalogue: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().min(0),
        imageUrl: imageUrlSchema.optional(),
      })
    )
    .max(20, 'Maximum 20 catalogue items'),
  priceRange: z.enum(['budget', 'moderate', 'premium', 'luxury']),
  paymentMethods: z
    .array(z.enum(['cash', 'card', 'digital-wallet', 'bank-transfer', 'crypto']))
    .min(1, 'Select at least one payment method'),
  businessHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }),
  holidayCalendar: z
    .array(
      z.object({
        date: z.string(),
        reason: z.string(),
        closed: z.boolean(),
      })
    )
    .default([]),
  partners: z.array(z.string()).default([]),
  category: z.string().min(1, 'Business category is required'),
});

/**
 * Artist-specific fields
 */
export const artistDataSchema = z.object({
  portfolio: z
    .array(
      z.object({
        type: z.enum(['image', 'video']),
        url: z.string().url(),
        caption: z.string().optional(),
        order: z.number(),
      })
    )
    .min(3, 'Add at least 3 portfolio items')
    .max(20, 'Maximum 20 portfolio items'),
  genres: z.array(z.string()).min(1, 'Select at least one genre/medium'),
  representation: z
    .object({
      name: z.string(),
      email: emailSchema,
      phone: phoneSchema,
    })
    .optional(),
  availabilityCalendar: z
    .array(
      z.object({
        date: z.string(),
        status: z.enum(['available', 'booked', 'unavailable']),
      })
    )
    .default([]),
  bookingLeadTime: z.number().min(0).default(7),
});

/**
 * Professional-specific fields
 */
export const professionalDataSchema = z.object({
  credentials: z.array(z.string().url()).min(1, 'Upload at least one credential document'),
  credentialsVerified: z.boolean().default(false),
  influencerLicence: z
    .object({
      platform: z.string(),
      handle: z.string(),
      followerCount: z.number().min(10000),
      verified: z.boolean().default(false),
    })
    .optional(),
  expertiseAreas: z.array(z.string()).min(1, 'Select at least one area of expertise'),
  availabilityStatus: z.enum(['available', 'not-available', 'by-request']).default('available'),
  rateCard: z.array(
    z.object({
      type: z.enum(['hourly', 'project-based', 'sponsorship']),
      rate: z.number().min(0),
      description: z.string().optional(),
    })
  ),
  currency: z.enum(['AUD', 'USD', 'GBP', 'EUR', 'NZD', 'AED']).default('AUD'),
  responseTime: z.enum(['24-hours', '2-3-days', '1-week']).default('24-hours'),
});

// ---------------------------------------------------------------------------
// Complete Profile Schema (All Steps Combined)
// ---------------------------------------------------------------------------

export const completeProfileSchema = z
  .object({
    // Step 1: Identity
    ...step1IdentitySchema.shape,
    // Step 2: Media
    ...step2MediaSchema.shape,
    // Step 3: Legal (base fields)
    ...step3LegalBaseSchema.shape,
    // Step 4: Location
    ...step4LocationSchema.shape,
    // Step 5: Description
    ...step5DescriptionSchema.shape,
    // Entity-specific data (optional, validated separately)
    communityData: communityDataSchema.optional(),
    organiserData: organiserDataSchema.optional(),
    venueData: venueDataSchema.optional(),
    businessData: businessDataSchema.optional(),
    artistData: artistDataSchema.optional(),
    professionalData: professionalDataSchema.optional(),
    // Metadata
    status: z.enum(['draft', 'published', 'pending_verification', 'suspended']).default('draft'),
    verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending'),

    // Multi-organizer support for communities & businesses
    organizers: z.array(z.object({
      userId: z.string(),
      role: z.string().default('co_organizer'),
      title: z.string().optional(),
      addedAt: z.string(),
      addedBy: z.string().optional(),
    })).default([]),
  })
  .refine(
    (data) => {
      // Ensure entity-specific data exists for the selected entity type
      switch (data.entityType) {
        case 'community':
          return data.communityData !== undefined;
        case 'organiser':
          return data.organiserData !== undefined;
        case 'venue':
          return data.venueData !== undefined;
        case 'business':
          return data.businessData !== undefined;
        case 'artist':
          return data.artistData !== undefined;
        case 'professional':
          return data.professionalData !== undefined;
        default:
          return false;
      }
    },
    {
      message: 'Entity-specific data is required',
      path: ['entityType'],
    }
  );

// ---------------------------------------------------------------------------
// Step Validation Helper
// ---------------------------------------------------------------------------

/**
 * Get the validation schema for a specific wizard step
 */
export function getStepSchema(step: number, entityType?: string) {
  switch (step) {
    case 1:
      return step1IdentitySchema;
    case 2:
      return step2MediaSchema;
    case 3:
      // Return entity-specific legal schema if entity type is known
      if (entityType === 'business' || entityType === 'venue') {
        return step3LegalBusinessSchema;
      } else if (entityType === 'organiser') {
        return step3LegalOrganiserSchema;
      } else if (entityType === 'professional') {
        return step3LegalProfessionalSchema;
      }
      return step3LegalBaseSchema;
    case 4:
      return step4LocationSchema;
    case 5:
      return step5DescriptionSchema;
    case 6:
      // Step 6 is review, validate complete profile
      return completeProfileSchema;
    default:
      throw new Error(`Invalid step number: ${step}`);
  }
}

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type Step1Identity = z.infer<typeof step1IdentitySchema>;
export type Step2Media = z.infer<typeof step2MediaSchema>;
export type Step3LegalBase = z.infer<typeof step3LegalBaseSchema>;
export type Step3LegalBusiness = z.infer<typeof step3LegalBusinessSchema>;
export type Step3LegalOrganiser = z.infer<typeof step3LegalOrganiserSchema>;
export type Step3LegalVenue = z.infer<typeof step3LegalVenueSchema>;
export type Step3LegalProfessional = z.infer<typeof step3LegalProfessionalSchema>;
export type Step4Location = z.infer<typeof step4LocationSchema>;
export type Step5Description = z.infer<typeof step5DescriptionSchema>;
export type CommunityData = z.infer<typeof communityDataSchema>;
export type OrganiserData = z.infer<typeof organiserDataSchema>;
export type VenueData = z.infer<typeof venueDataSchema>;
export type BusinessData = z.infer<typeof businessDataSchema>;
export type ArtistData = z.infer<typeof artistDataSchema>;
export type ProfessionalData = z.infer<typeof professionalDataSchema>;
export type CompleteProfile = z.infer<typeof completeProfileSchema>;
export type Address = z.infer<typeof addressSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type Licence = z.infer<typeof licenceSchema>;
