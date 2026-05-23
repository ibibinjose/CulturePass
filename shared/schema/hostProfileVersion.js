"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileVersionDiffSchema = exports.CreateProfileVersionSchema = exports.ProfileVersionSchema = void 0;
const zod_1 = require("zod");
const hostProfile_1 = require("./hostProfile");
// ============================================================================
// HostSpace Enterprise-Grade Form System - Profile Version Schema
// ============================================================================
// This schema defines the data model for profile version history, enabling
// complete audit trails and rollback capability.
//
// Related: requirements.md (Requirement 18), design.md (ProfileVersion)
// ============================================================================
exports.ProfileVersionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    profileId: zod_1.z.string(),
    versionNumber: zod_1.z.number().int().positive(),
    data: hostProfile_1.HostProfileSchema, // Complete snapshot of profile at this version
    changedFields: zod_1.z.array(zod_1.z.string()).default([]),
    changedBy: zod_1.z.string(), // Firebase Auth UID
    changeReason: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(), // ISO 8601 timestamp
});
// Schema for creating a new version
exports.CreateProfileVersionSchema = exports.ProfileVersionSchema.omit({
    id: true,
    createdAt: true,
});
// Schema for version comparison (diff view)
exports.ProfileVersionDiffSchema = zod_1.z.object({
    versionNumber: zod_1.z.number().int().positive(),
    previousVersionNumber: zod_1.z.number().int().positive(),
    changedFields: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        oldValue: zod_1.z.unknown(),
        newValue: zod_1.z.unknown(),
    })),
    changedBy: zod_1.z.string(),
    changedAt: zod_1.z.string(), // ISO 8601 timestamp
});
//# sourceMappingURL=hostProfileVersion.js.map