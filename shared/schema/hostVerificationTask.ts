import { z } from 'zod';
import { HostEntityTypeSchema } from './hostTypes';

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

const verificationTaskStatusSchema = z.enum([
  'pending',
  'in-review',
  'approved',
  'rejected',
  'more-info-needed',
]);

function requireProfileOrPageId(
  data: { profileId?: string; pageId?: string },
  ctx: z.RefinementCtx,
) {
  if (!data.profileId && !data.pageId) {
    ctx.addIssue({
      code: 'custom',
      path: ['profileId'],
      message: 'Either profileId or pageId is required',
    });
  }
}

const verificationTaskBodyShape = {
  /** HostSpace rich profile (legacy wizard) */
  profileId: z.string().optional(),
  /** Unified Create a Page flow */
  pageId: z.string().optional(),
  entityType: z.lazy(() => HostEntityTypeSchema),
  submittedBy: z.string(), // Firebase Auth UID
  submittedAt: z.string(), // ISO 8601 timestamp
  status: verificationTaskStatusSchema.default('pending'),
  assignedTo: z.string().optional(), // Admin user ID
  documents: z.array(z.string().url()).default([]), // URLs to uploaded documents
  checklist: z.array(VerificationChecklistItemSchema).default([]),
  adminNotes: z.string().default(''),
  rejectionReason: z.string().optional(),
  completedAt: z.string().optional(), // ISO 8601 timestamp
  slaDeadline: z.string(), // ISO 8601 timestamp (48 hours standard, 24 hours premium)
};

export const VerificationTaskSchema = z
  .object({
    id: z.string(),
    ...verificationTaskBodyShape,
  })
  .superRefine(requireProfileOrPageId);

export type VerificationTask = z.infer<typeof VerificationTaskSchema>;

// Schema for creating a new verification task (Zod v4: cannot .omit() refined schemas)
export const CreateVerificationTaskSchema = z
  .object({
    profileId: verificationTaskBodyShape.profileId,
    pageId: verificationTaskBodyShape.pageId,
    entityType: verificationTaskBodyShape.entityType,
    submittedBy: verificationTaskBodyShape.submittedBy,
    status: verificationTaskBodyShape.status,
    assignedTo: verificationTaskBodyShape.assignedTo,
    documents: verificationTaskBodyShape.documents,
    checklist: verificationTaskBodyShape.checklist,
    adminNotes: verificationTaskBodyShape.adminNotes,
    rejectionReason: verificationTaskBodyShape.rejectionReason,
    slaDeadline: verificationTaskBodyShape.slaDeadline,
  })
  .superRefine(requireProfileOrPageId);

export type CreateVerificationTask = z.infer<typeof CreateVerificationTaskSchema>;

// Schema for updating a verification task (admin actions)
export const UpdateVerificationTaskSchema = z.object({
  id: z.string(),
  pageId: z.string().optional(),
  status: verificationTaskStatusSchema.optional(),
  assignedTo: z.string().optional(),
  documents: z.array(z.string().url()).optional(),
  checklist: z.array(VerificationChecklistItemSchema).optional(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  completedAt: z.string().optional(),
  slaDeadline: z.string().optional(),
});

export type UpdateVerificationTask = z.infer<typeof UpdateVerificationTaskSchema>;

// Schema for verification task filters (admin dashboard)
export const VerificationTaskFiltersSchema = z.object({
  status: verificationTaskStatusSchema.optional(),
  entityType: z.lazy(() => HostEntityTypeSchema).optional(),
  assignedTo: z.string().optional(),
  overdueSla: z.boolean().optional(),
});

export type VerificationTaskFilters = z.infer<typeof VerificationTaskFiltersSchema>;
