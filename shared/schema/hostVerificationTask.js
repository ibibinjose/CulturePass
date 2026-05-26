"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationTaskFiltersSchema = exports.UpdateVerificationTaskSchema = exports.CreateVerificationTaskSchema = exports.VerificationTaskSchema = exports.VerificationChecklistItemSchema = void 0;
const zod_1 = require("zod");
const hostTypes_1 = require("./hostTypes");
// ============================================================================
// HostSpace Enterprise-Grade Form System - Verification Task Schema
// ============================================================================
// This schema defines the data model for admin verification tasks for
// profiles that require legal/regulatory validation.
//
// Related: requirements.md (Requirement 8), design.md (VerificationTask)
// ============================================================================
exports.VerificationChecklistItemSchema = zod_1.z.object({
    item: zod_1.z.string().min(1),
    checked: zod_1.z.boolean().default(false),
    notes: zod_1.z.string().optional(),
});
exports.VerificationTaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    profileId: zod_1.z.string(),
    entityType: zod_1.z.lazy(() => hostTypes_1.HostEntityTypeSchema),
    submittedBy: zod_1.z.string(), // Firebase Auth UID
    submittedAt: zod_1.z.string(), // ISO 8601 timestamp
    status: zod_1.z.enum(['pending', 'in-review', 'approved', 'rejected', 'more-info-needed']).default('pending'),
    assignedTo: zod_1.z.string().optional(), // Admin user ID
    documents: zod_1.z.array(zod_1.z.string().url()).default([]), // URLs to uploaded documents
    checklist: zod_1.z.array(exports.VerificationChecklistItemSchema).default([]),
    adminNotes: zod_1.z.string().default(''),
    rejectionReason: zod_1.z.string().optional(),
    completedAt: zod_1.z.string().optional(), // ISO 8601 timestamp
    slaDeadline: zod_1.z.string(), // ISO 8601 timestamp (48 hours standard, 24 hours premium)
});
// Schema for creating a new verification task
exports.CreateVerificationTaskSchema = exports.VerificationTaskSchema.omit({
    id: true,
    submittedAt: true,
    completedAt: true,
});
// Schema for updating a verification task (admin actions)
exports.UpdateVerificationTaskSchema = exports.VerificationTaskSchema.partial()
    .required({
    id: true,
})
    .omit({
    submittedAt: true,
    submittedBy: true,
    profileId: true,
    entityType: true,
});
// Schema for verification task filters (admin dashboard)
exports.VerificationTaskFiltersSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'in-review', 'approved', 'rejected', 'more-info-needed']).optional(),
    entityType: zod_1.z.lazy(() => hostTypes_1.HostEntityTypeSchema).optional(),
    assignedTo: zod_1.z.string().optional(),
    overdueSla: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=hostVerificationTask.js.map