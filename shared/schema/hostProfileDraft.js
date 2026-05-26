"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDraftSchema = exports.CreateProfileDraftSchema = exports.ProfileDraftSchema = void 0;
const zod_1 = require("zod");
const hostTypes_1 = require("./hostTypes");
const hostProfile_1 = require("./hostProfile");
// ============================================================================
// HostSpace Enterprise-Grade Form System - Profile Draft Schema
// ============================================================================
// This schema defines the data model for draft profiles that are saved
// automatically every 8 seconds during the form wizard flow.
//
// Related: requirements.md (Requirement 3), design.md (ProfileDraft)
// ============================================================================
exports.ProfileDraftSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(), // Firebase Auth UID
    entityType: hostTypes_1.HostEntityTypeSchema,
    formData: hostProfile_1.HostProfileFormDataSchema, // Incomplete profile data
    currentStep: zod_1.z.number().int().min(1).max(6),
    completedSteps: zod_1.z.array(zod_1.z.number().int().min(1).max(6)).default([]),
    createdAt: zod_1.z.string(), // ISO 8601 timestamp
    updatedAt: zod_1.z.string(), // ISO 8601 timestamp
    expiresAt: zod_1.z.string(), // ISO 8601 timestamp (90 days from last update)
    deviceInfo: zod_1.z
        .object({
        platform: zod_1.z.string(),
        userAgent: zod_1.z.string(),
    })
        .optional(),
});
// Schema for creating a new draft
exports.CreateProfileDraftSchema = exports.ProfileDraftSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    expiresAt: true,
});
// Schema for updating an existing draft
exports.UpdateProfileDraftSchema = exports.ProfileDraftSchema.partial()
    .required({
    id: true,
    userId: true,
})
    .omit({
    createdAt: true,
});
//# sourceMappingURL=hostProfileDraft.js.map