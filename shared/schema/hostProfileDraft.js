"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDraftBodySchema = exports.UpdateProfileDraftSchema = exports.CreateProfileDraftSchema = exports.ProfileDraftSchema = void 0;
const zod_1 = require("zod");
const hostTypes_1 = require("./hostTypes");
const hostProfile_1 = require("./hostProfile");
const profileDraftDeviceInfoSchema = zod_1.z
    .object({
    platform: zod_1.z.string(),
    userAgent: zod_1.z.string(),
})
    .optional();
exports.ProfileDraftSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    entityType: hostTypes_1.HostEntityTypeSchema,
    formData: hostProfile_1.HostProfileFormDataSchema,
    currentStep: zod_1.z.number().int().min(1).max(10),
    completedSteps: zod_1.z.array(zod_1.z.number().int().min(1).max(10)).default([]),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    expiresAt: zod_1.z.string(),
    deviceInfo: profileDraftDeviceInfoSchema,
});
exports.CreateProfileDraftSchema = exports.ProfileDraftSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    expiresAt: true,
});
exports.UpdateProfileDraftSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    entityType: hostTypes_1.HostEntityTypeSchema.optional(),
    formData: hostProfile_1.HostProfileFormDataSchema.optional(),
    currentStep: zod_1.z.number().int().min(1).max(10).optional(),
    completedSteps: zod_1.z.array(zod_1.z.number().int().min(1).max(10)).optional(),
    updatedAt: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().optional(),
    deviceInfo: profileDraftDeviceInfoSchema,
});
exports.UpdateProfileDraftBodySchema = zod_1.z.object({
    entityType: hostTypes_1.HostEntityTypeSchema.optional(),
    formData: hostProfile_1.HostProfileFormDataSchema.optional(),
    currentStep: zod_1.z.number().int().min(1).max(10).optional(),
    completedSteps: zod_1.z.array(zod_1.z.number().int().min(1).max(10)).optional(),
    updatedAt: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().optional(),
    deviceInfo: profileDraftDeviceInfoSchema,
});
//# sourceMappingURL=hostProfileDraft.js.map