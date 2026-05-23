/**
 * Host Module Schemas
 * 
 * Exports all Zod validation schemas for the HostSpace Enterprise-Grade Form System.
 */

export {
  // Field Schemas
  handleSchema,
  officialNameSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  imageUrlSchema,
  abnSchema,
  pastDateSchema,
  taglineSchema,
  descriptionSchema,
  addressSchema,
  socialLinkSchema,
  licenceSchema,

  // Step Schemas
  step1IdentitySchema,
  step2MediaSchema,
  step3LegalBaseSchema,
  step3LegalBusinessSchema,
  step3LegalOrganiserSchema,
  step3LegalVenueSchema,
  step3LegalProfessionalSchema,
  step4LocationSchema,
  step5DescriptionSchema,

  // Entity-Specific Schemas
  communityDataSchema,
  organiserDataSchema,
  venueDataSchema,
  businessDataSchema,
  artistDataSchema,
  professionalDataSchema,

  // Complete Profile Schema
  completeProfileSchema,

  // Helper Functions
  getStepSchema,

  // Type Exports
  type Step1Identity,
  type Step2Media,
  type Step3LegalBase,
  type Step3LegalBusiness,
  type Step3LegalOrganiser,
  type Step3LegalVenue,
  type Step3LegalProfessional,
  type Step4Location,
  type Step5Description,
  type CommunityData,
  type OrganiserData,
  type VenueData,
  type BusinessData,
  type ArtistData,
  type ProfessionalData,
  type CompleteProfile,
  type Address,
  type SocialLink,
  type Licence,
} from './profileSchema';

export {
  // Entity Type Constants
  ENTITY_TYPES,
  ENTITY_TYPE_METADATA,

  // Entity Form Schemas
  communityFormSchema,
  organiserFormSchema,
  venueFormSchema,
  businessFormSchema,
  artistFormSchema,
  professionalFormSchema,

  // Schema Lookup Functions
  getEntityFormSchema,
  getEntityDataSchema,
  getEntityLegalSchema,
  getEntityDataFieldName,

  // Type Exports
  type EntityType,
  type EntityTypeMetadata,
  type CommunityForm,
  type OrganiserForm,
  type VenueForm,
  type BusinessForm,
  type ArtistForm,
  type ProfessionalForm,
} from './entitySchemas';

export {
  // Field Constraints
  FIELD_LIMITS,
  VALIDATION_TIMING,
  RESERVED_HANDLES,
  VALIDATION_PATTERNS,
  MEDIA_CONSTRAINTS,

  // Validation Functions
  validateABNChecksum,
  validateACNChecksum,
  isReservedHandle,
  validateHandleFormat,
  validateEmailFormat,
  validatePhoneFormat,
  validateUrlFormat,
  validatePastDate,
  validateFireSafetyCapacity,
  calculateReadabilityScore,
  formatABNDisplay,
  stripABNFormatting,
  generateSuggestedHandle,

  // Step Requirements
  STEP_REQUIRED_FIELDS,
  getStepRequiredFields,
} from './validationRules';
