import { z } from 'zod';
export declare const ProfileDraftSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    entityType: z.ZodEnum<{
        venue: "venue";
        community: "community";
        organiser: "organiser";
        business: "business";
        artist: "artist";
        professional: "professional";
    }>;
    formData: z.ZodAny;
    currentStep: z.ZodNumber;
    completedSteps: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    expiresAt: z.ZodString;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        platform: z.ZodString;
        userAgent: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ProfileDraft = z.infer<typeof ProfileDraftSchema>;
export declare const CreateProfileDraftSchema: z.ZodObject<{
    entityType: z.ZodEnum<{
        venue: "venue";
        community: "community";
        organiser: "organiser";
        business: "business";
        artist: "artist";
        professional: "professional";
    }>;
    formData: z.ZodAny;
    userId: z.ZodString;
    currentStep: z.ZodNumber;
    completedSteps: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        platform: z.ZodString;
        userAgent: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateProfileDraft = z.infer<typeof CreateProfileDraftSchema>;
export declare const UpdateProfileDraftSchema: z.ZodObject<{
    entityType: z.ZodOptional<z.ZodEnum<{
        venue: "venue";
        community: "community";
        organiser: "organiser";
        business: "business";
        artist: "artist";
        professional: "professional";
    }>>;
    id: z.ZodNonOptional<z.ZodOptional<z.ZodString>>;
    updatedAt: z.ZodOptional<z.ZodString>;
    formData: z.ZodOptional<z.ZodAny>;
    userId: z.ZodNonOptional<z.ZodOptional<z.ZodString>>;
    currentStep: z.ZodOptional<z.ZodNumber>;
    completedSteps: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNumber>>>;
    expiresAt: z.ZodOptional<z.ZodString>;
    deviceInfo: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        platform: z.ZodString;
        userAgent: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type UpdateProfileDraft = z.infer<typeof UpdateProfileDraftSchema>;
//# sourceMappingURL=hostProfileDraft.d.ts.map