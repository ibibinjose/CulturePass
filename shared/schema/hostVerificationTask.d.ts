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
    entityType: z.ZodEnum<{
        community: "community";
        organiser: "organiser";
        venue: "venue";
        business: "business";
        artist: "artist";
        professional: "professional";
    }>;
    submittedBy: z.ZodString;
    submittedAt: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        rejected: "rejected";
        "in-review": "in-review";
        approved: "approved";
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
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        rejected: "rejected";
        "in-review": "in-review";
        approved: "approved";
        "more-info-needed": "more-info-needed";
    }>>;
    entityType: z.ZodEnum<{
        community: "community";
        organiser: "organiser";
        venue: "venue";
        business: "business";
        artist: "artist";
        professional: "professional";
    }>;
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
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        rejected: "rejected";
        "in-review": "in-review";
        approved: "approved";
        "more-info-needed": "more-info-needed";
    }>>>;
    id: z.ZodNonOptional<z.ZodOptional<z.ZodString>>;
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
        rejected: "rejected";
        "in-review": "in-review";
        approved: "approved";
        "more-info-needed": "more-info-needed";
    }>>;
    entityType: z.ZodOptional<z.ZodEnum<{
        community: "community";
        organiser: "organiser";
        venue: "venue";
        business: "business";
        artist: "artist";
        professional: "professional";
    }>>;
    assignedTo: z.ZodOptional<z.ZodString>;
    overdueSla: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type VerificationTaskFilters = z.infer<typeof VerificationTaskFiltersSchema>;
