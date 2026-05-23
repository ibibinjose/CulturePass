/**
 * Entity-Specific Form Schemas
 *
 * Provides per-entity-type Zod schemas that extend the base step schemas
 * with entity-specific required fields. Used by the wizard to determine
 * which fields are required/optional based on the selected entity type.
 *
 * Each entity type has:
 * - A step 3 (Legal) override with entity-specific requirements
 * - An entity data schema for the entity-specific section
 * - A complete form schema combining all steps + entity data
 */

import { z } from 'zod';
import {
  step1IdentitySchema,
  step2MediaSchema,
  step3LegalBaseSchema,
  step3LegalBusinessSchema,
  step3LegalOrganiserSchema,
  step3LegalVenueSchema,
  step3LegalProfessionalSchema,
  step4LocationSchema,
  step5DescriptionSchema,
  communityDataSchema,
  organiserDataSchema,
  venueDataSchema,
  businessDataSchema,
  artistDataSchema,
  professionalDataSchema,
} from './profileSchema';

// ---------------------------------------------------------------------------
// Entity Type Definition
// ---------------------------------------------------------------------------

export const ENTITY_TYPES = [
  'community',
  'organiser',
  'venue',
  'business',
  'artist',
  'professional',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

// ---------------------------------------------------------------------------
// Entity Type Metadata
// ---------------------------------------------------------------------------

export interface EntityTypeMetadata {
  type: EntityType;
  label: string;
  description: string;
  icon: string;
  category: 'communities' | 'venues' | 'businesses';
  requiresVerification: boolean;
  requiresABN: boolean;
}

export const ENTITY_TYPE_METADATA: Record<EntityType, EntityTypeMetadata> = {
  community: {
    type: 'community',
    label: 'Community',
    description: 'Cultural groups with membership models',
    icon: 'people-outline',
    category: 'communities',
    requiresVerification: false,
    requiresABN: false,
  },
  organiser: {
    type: 'organiser',
    label: 'Organiser',
    description: 'Event producers with credentials and insurance',
    icon: 'calendar-outline',
    category: 'communities',
    requiresVerification: true,
    requiresABN: false, // Optional unless paid events
  },
  venue: {
    type: 'venue',
    label: 'Venue',
    description: 'Physical spaces with capacity and technical specs',
    icon: 'location-outline',
    category: 'venues',
    requiresVerification: true,
    requiresABN: true,
  },
  business: {
    type: 'business',
    label: 'Business',
    description: 'Commercial entities with product/service catalogues',
    icon: 'briefcase-outline',
    category: 'businesses',
    requiresVerification: true,
    requiresABN: true,
  },
  artist: {
    type: 'artist',
    label: 'Artist',
    description: 'Performers with portfolios and availability calendars',
    icon: 'color-palette-outline',
    category: 'businesses',
    requiresVerification: false,
    requiresABN: false,
  },
  professional: {
    type: 'professional',
    label: 'Professional',
    description: 'Freelancers, experts, and influencers with rate cards',
    icon: 'person-outline',
    category: 'businesses',
    requiresVerification: true,
    requiresABN: false,
  },
};

// ---------------------------------------------------------------------------
// Entity-Specific Complete Form Schemas
// ---------------------------------------------------------------------------

/**
 * Community complete form schema
 */
export const communityFormSchema = z.object({
  ...step1IdentitySchema.shape,
  ...step2MediaSchema.shape,
  ...step3LegalBaseSchema.shape,
  ...step4LocationSchema.shape,
  ...step5DescriptionSchema.shape,
  communityData: communityDataSchema,
  entityType: z.literal('community'),
});

/**
 * Organiser complete form schema
 */
export const organiserFormSchema = z.object({
  ...step1IdentitySchema.shape,
  ...step2MediaSchema.shape,
  ...step3LegalOrganiserSchema.shape,
  ...step4LocationSchema.shape,
  ...step5DescriptionSchema.shape,
  organiserData: organiserDataSchema,
  entityType: z.literal('organiser'),
});

/**
 * Venue complete form schema
 */
export const venueFormSchema = z.object({
  ...step1IdentitySchema.shape,
  ...step2MediaSchema.shape,
  ...step3LegalVenueSchema.shape,
  ...step4LocationSchema.shape,
  ...step5DescriptionSchema.shape,
  venueData: venueDataSchema,
  entityType: z.literal('venue'),
});

/**
 * Business complete form schema
 */
export const businessFormSchema = z.object({
  ...step1IdentitySchema.shape,
  ...step2MediaSchema.shape,
  ...step3LegalBusinessSchema.shape,
  ...step4LocationSchema.shape,
  ...step5DescriptionSchema.shape,
  businessData: businessDataSchema,
  entityType: z.literal('business'),
});

/**
 * Artist complete form schema
 */
export const artistFormSchema = z.object({
  ...step1IdentitySchema.shape,
  ...step2MediaSchema.shape,
  ...step3LegalBaseSchema.shape,
  ...step4LocationSchema.shape,
  ...step5DescriptionSchema.shape,
  artistData: artistDataSchema,
  entityType: z.literal('artist'),
});

/**
 * Professional complete form schema
 */
export const professionalFormSchema = z.object({
  ...step1IdentitySchema.shape,
  ...step2MediaSchema.shape,
  ...step3LegalProfessionalSchema.shape,
  ...step4LocationSchema.shape,
  ...step5DescriptionSchema.shape,
  professionalData: professionalDataSchema,
  entityType: z.literal('professional'),
});

// ---------------------------------------------------------------------------
// Schema Lookup
// ---------------------------------------------------------------------------

/**
 * Get the complete form schema for a given entity type
 */
export function getEntityFormSchema(entityType: EntityType) {
  switch (entityType) {
    case 'community':
      return communityFormSchema;
    case 'organiser':
      return organiserFormSchema;
    case 'venue':
      return venueFormSchema;
    case 'business':
      return businessFormSchema;
    case 'artist':
      return artistFormSchema;
    case 'professional':
      return professionalFormSchema;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Get the entity-specific data schema for a given entity type
 */
export function getEntityDataSchema(entityType: EntityType) {
  switch (entityType) {
    case 'community':
      return communityDataSchema;
    case 'organiser':
      return organiserDataSchema;
    case 'venue':
      return venueDataSchema;
    case 'business':
      return businessDataSchema;
    case 'artist':
      return artistDataSchema;
    case 'professional':
      return professionalDataSchema;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Get the legal/compliance schema for a given entity type (Step 3)
 */
export function getEntityLegalSchema(entityType: EntityType) {
  switch (entityType) {
    case 'business':
    case 'venue':
      return step3LegalBusinessSchema;
    case 'organiser':
      return step3LegalOrganiserSchema;
    case 'professional':
      return step3LegalProfessionalSchema;
    case 'community':
    case 'artist':
    default:
      return step3LegalBaseSchema;
  }
}

/**
 * Get the entity-specific data field name for a given entity type
 */
export function getEntityDataFieldName(entityType: EntityType): string {
  return `${entityType}Data`;
}

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type CommunityForm = z.infer<typeof communityFormSchema>;
export type OrganiserForm = z.infer<typeof organiserFormSchema>;
export type VenueForm = z.infer<typeof venueFormSchema>;
export type BusinessForm = z.infer<typeof businessFormSchema>;
export type ArtistForm = z.infer<typeof artistFormSchema>;
export type ProfessionalForm = z.infer<typeof professionalFormSchema>;
