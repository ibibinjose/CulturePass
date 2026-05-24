import { z } from 'zod';
import { HostProfileSchema } from './hostProfile';

// ============================================================================
// HostSpace Enterprise-Grade Form System - Profile Version Schema
// ============================================================================
// This schema defines the data model for profile version history, enabling
// complete audit trails and rollback capability.
//
// Related: requirements.md (Requirement 18), design.md (ProfileVersion)
// ============================================================================

export const ProfileVersionSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  versionNumber: z.number().int().positive(),
  data: HostProfileSchema, // Complete snapshot of profile at this version
  changedFields: z.array(z.string()).default([]),
  changedBy: z.string(), // Firebase Auth UID
  changeReason: z.string().optional(),
  createdAt: z.string(), // ISO 8601 timestamp
});

export type ProfileVersion = z.infer<typeof ProfileVersionSchema>;

// Schema for creating a new version
export const CreateProfileVersionSchema = ProfileVersionSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateProfileVersion = z.infer<typeof CreateProfileVersionSchema>;

// Schema for version comparison (diff view)
export const ProfileVersionDiffSchema = z.object({
  versionNumber: z.number().int().positive(),
  previousVersionNumber: z.number().int().positive(),
  changedFields: z.array(
    z.object({
      field: z.string(),
      oldValue: z.unknown(),
      newValue: z.unknown(),
    })
  ),
  changedBy: z.string(),
  changedAt: z.string(), // ISO 8601 timestamp
});

export type ProfileVersionDiff = z.infer<typeof ProfileVersionDiffSchema>;
