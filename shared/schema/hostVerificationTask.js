"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationTaskFiltersSchema = exports.UpdateVerificationTaskSchema = exports.CreateVerificationTaskSchema = exports.VerificationTaskSchema = exports.VerificationChecklistItemSchema = void 0;
const zod_1 = require("zod");
const hostTypes_1 = require("./hostTypes");
exports.VerificationChecklistItemSchema = zod_1.z.object({
    item: zod_1.z.string().min(1),
    checked: zod_1.z.boolean().default(false),
    notes: zod_1.z.string().optional(),
});
const verificationTaskStatusSchema = zod_1.z.enum([
    'pending',
    'in-review',
    'approved',
    'rejected',
    'more-info-needed',
]);
function requireProfileOrPageId(data, ctx) {
    if (!data.profileId && !data.pageId) {
        ctx.addIssue({
            code: 'custom',
            path: ['profileId'],
            message: 'Either profileId or pageId is required',
        });
    }
}
const verificationTaskBodyShape = {
    profileId: zod_1.z.string().optional(),
    pageId: zod_1.z.string().optional(),
    entityType: zod_1.z.lazy(() => hostTypes_1.HostEntityTypeSchema),
    submittedBy: zod_1.z.string(),
    submittedAt: zod_1.z.string(),
    status: verificationTaskStatusSchema.default('pending'),
    assignedTo: zod_1.z.string().optional(),
    documents: zod_1.z.array(zod_1.z.string().url()).default([]),
    checklist: zod_1.z.array(exports.VerificationChecklistItemSchema).default([]),
    adminNotes: zod_1.z.string().default(''),
    rejectionReason: zod_1.z.string().optional(),
    completedAt: zod_1.z.string().optional(),
    slaDeadline: zod_1.z.string(),
};
exports.VerificationTaskSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    ...verificationTaskBodyShape,
})
    .superRefine(requireProfileOrPageId);
exports.CreateVerificationTaskSchema = zod_1.z
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
exports.UpdateVerificationTaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    pageId: zod_1.z.string().optional(),
    status: verificationTaskStatusSchema.optional(),
    assignedTo: zod_1.z.string().optional(),
    documents: zod_1.z.array(zod_1.z.string().url()).optional(),
    checklist: zod_1.z.array(exports.VerificationChecklistItemSchema).optional(),
    adminNotes: zod_1.z.string().optional(),
    rejectionReason: zod_1.z.string().optional(),
    completedAt: zod_1.z.string().optional(),
    slaDeadline: zod_1.z.string().optional(),
});
exports.VerificationTaskFiltersSchema = zod_1.z.object({
    status: verificationTaskStatusSchema.optional(),
    entityType: zod_1.z.lazy(() => hostTypes_1.HostEntityTypeSchema).optional(),
    assignedTo: zod_1.z.string().optional(),
    overdueSla: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=hostVerificationTask.js.map