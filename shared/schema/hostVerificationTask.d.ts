import { z } from 'zod';
export declare const VerificationChecklistItemSchema: z.ZodObject<{
    item: z.ZodString;
    checked: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type VerificationChecklistItem = z.infer<typeof VerificationChecklistItemSchema>;
export declare const VerificationTaskSchema: z.ZodObject<{
    id: z.ZodString;
    profileId: z.ZodString;
    entityType: z.ZodLazy<z.ZodEnum<{
        business: "business";
        community: "community";
        venue: "venue";
        artist: "artist";
        professional: "professional";
        organiser: "organiser";
    }>>;
    submittedBy: z.ZodString;
    submittedAt: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
        "in-review": "in-review";
        "more-info-needed": "more-info-needed";
    }>>;
    assignedTo: z.ZodOptional<z.ZodString>;
    documents: z.ZodDefault<z.ZodArray<z.ZodString>>;
    checklist: z.ZodDefault<z.ZodArray<z.ZodObject<{
        item: z.ZodString;
        checked: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    adminNotes: z.ZodDefault<z.ZodString>;
    rejectionReason: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
    slaDeadline: z.ZodString;
}, z.core.$strip>;
export type VerificationTask = z.infer<typeof VerificationTaskSchema>;
export declare const CreateVerificationTaskSchema: z.ZodObject<{
    entityType: z.ZodLazy<z.ZodEnum<{
        business: "business";
        community: "community";
        venue: "venue";
        artist: "artist";
        professional: "professional";
        organiser: "organiser";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
        "in-review": "in-review";
        "more-info-needed": "more-info-needed";
    }>>;
    profileId: z.ZodString;
    submittedBy: z.ZodString;
    assignedTo: z.ZodOptional<z.ZodString>;
    documents: z.ZodDefault<z.ZodArray<z.ZodString>>;
    checklist: z.ZodDefault<z.ZodArray<z.ZodObject<{
        item: z.ZodString;
        checked: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    adminNotes: z.ZodDefault<z.ZodString>;
    rejectionReason: z.ZodOptional<z.ZodString>;
    slaDeadline: z.ZodString;
}, z.core.$strip>;
export type CreateVerificationTask = z.infer<typeof CreateVerificationTaskSchema>;
export declare const UpdateVerificationTaskSchema: z.ZodObject<{
    id: z.ZodNonOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
        "in-review": "in-review";
        "more-info-needed": "more-info-needed";
    }>>>;
    assignedTo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    documents: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>;
    checklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        item: z.ZodString;
        checked: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
    adminNotes: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    rejectionReason: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    completedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slaDeadline: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateVerificationTask = z.infer<typeof UpdateVerificationTaskSchema>;
export declare const VerificationTaskFiltersSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
        "in-review": "in-review";
        "more-info-needed": "more-info-needed";
    }>>;
    entityType: z.ZodOptional<z.ZodLazy<z.ZodEnum<{
        business: "business";
        community: "community";
        venue: "venue";
        artist: "artist";
        professional: "professional";
        organiser: "organiser";
    }>>>;
    assignedTo: z.ZodOptional<z.ZodString>;
    overdueSla: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type VerificationTaskFilters = z.infer<typeof VerificationTaskFiltersSchema>;
//# sourceMappingURL=hostVerificationTask.d.ts.map