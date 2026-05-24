import { z } from 'zod';
import { HostEntityTypeSchema } from './hostProfile';

// ============================================================================
// HostSpace Enterprise-Grade Form System - Verification Task Schema
// ============================================================================
// This schema defines the data model for admin verification tasks for
// profiles that require legal/regulatory validation.
//
// Related: requirements.md (Requirement 8), design.md (VerificationTask)
// ============================================================================

export const VerificationChecklistItemSchema = z.object({
  item: z.string().min(1),
  checked: z.boolean().default(false),
  notes: z.string().optional(),
});

export type VerificationChecklistItem = z.infer<typeof VerificationChecklistItemSchema>;

export const VerificationTaskSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  entityType: HostEntityTypeSchema,
  submittedBy: z.string(), // Firebase Auth UID
  submittedAt: z.string(), // ISO 8601 timestamp
  status: z.enum(['pending', 'in-review', 'approved', 'rejected', 'more-info-needed']).default('pending'),
  assignedTo: z.string().optional(), // Admin user ID
  documents: z.array(z.string().url()).default([]), // URLs to uploaded documents
  checklist: z.array(VerificationChecklistItemSchema).default([]),
  adminNotes: z.string().default(''),
  rejectionReason: z.string().optional(),
  completedAt: z.string().optional(), // ISO 8601 timestamp
  slaDeadline: z.string(), // ISO 8601 timestamp (48 hours standard, 24 hours premium)
});

export type VerificationTask = z.infer<typeof VerificationTaskSchema>;

// Schema for creating a new verification task
export const CreateVerificationTaskSchema = VerificationTaskSchema.omit({
  id: true,
  submittedAt: true,
  completedAt: true,
});

export type CreateVerificationTask = z.infer<typeof CreateVerificationTaskSchema>;

// Schema for updating a verification task (admin actions)
export const UpdateVerificationTaskSchema = VerificationTaskSchema.partial()
  .required({
    id: true,
  })
  .omit({
    submittedAt: true,
    submittedBy: true,
    profileId: true,
    entityType: true,
  });

export type UpdateVerificationTask = z.infer<typeof UpdateVerificationTaskSchema>;

// Schema for verification task filters (admin dashboard)
export const VerificationTaskFiltersSchema = z.object({
  status: z.enum(['pending', 'in-review', 'approved', 'rejected', 'more-info-needed']).optional(),
  entityType: HostEntityTypeSchema.optional(),
  assignedTo: z.string().optional(),
  overdueSla: z.boolean().optional(),
});

export type VerificationTaskFilters = z.infer<typeof VerificationTaskFiltersSchema>;
