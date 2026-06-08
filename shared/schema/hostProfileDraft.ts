import { z } from 'zod';
import { HostEntityTypeSchema } from './hostTypes';
import { HostProfileFormDataSchema } from './hostProfile';

// ============================================================================
// HostSpace Enterprise-Grade Form System - Profile Draft Schema
// ============================================================================
// This schema defines the data model for draft profiles that are saved
// automatically every 8 seconds during the form wizard flow.
//
// Related: requirements.md (Requirement 3), design.md (ProfileDraft)
// ============================================================================

const profileDraftDeviceInfoSchema = z
  .object({
    platform: z.string(),
    userAgent: z.string(),
  })
  .optional();

export const ProfileDraftSchema = z.object({
  id: z.string(),
  userId: z.string(), // Firebase Auth UID
  entityType: HostEntityTypeSchema,
  formData: HostProfileFormDataSchema, // Incomplete profile data
  currentStep: z.number().int().min(1).max(10),
  completedSteps: z.array(z.number().int().min(1).max(10)).default([]),
  createdAt: z.string(), // ISO 8601 timestamp
  updatedAt: z.string(), // ISO 8601 timestamp
  expiresAt: z.string(), // ISO 8601 timestamp (90 days from last update)
  deviceInfo: profileDraftDeviceInfoSchema,
});

export type ProfileDraft = z.infer<typeof ProfileDraftSchema>;

// Schema for creating a new draft
export const CreateProfileDraftSchema = ProfileDraftSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
});

export type CreateProfileDraft = z.infer<typeof CreateProfileDraftSchema>;

// Schema for updating an existing draft (Zod v4: avoid .partial().required().omit())
export const UpdateProfileDraftSchema = z.object({
  id: z.string(),
  userId: z.string(),
  entityType: HostEntityTypeSchema.optional(),
  formData: HostProfileFormDataSchema.optional(),
  currentStep: z.number().int().min(1).max(10).optional(),
  completedSteps: z.array(z.number().int().min(1).max(10)).optional(),
  updatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  deviceInfo: profileDraftDeviceInfoSchema,
});

export type UpdateProfileDraft = z.infer<typeof UpdateProfileDraftSchema>;

/** PATCH body for POST /api/profiles/:id/draft (id/userId from route + auth). */
export const UpdateProfileDraftBodySchema = z.object({
  entityType: HostEntityTypeSchema.optional(),
  formData: HostProfileFormDataSchema.optional(),
  currentStep: z.number().int().min(1).max(10).optional(),
  completedSteps: z.array(z.number().int().min(1).max(10)).optional(),
  updatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  deviceInfo: profileDraftDeviceInfoSchema,
});

export type UpdateProfileDraftBody = z.infer<typeof UpdateProfileDraftBodySchema>;
