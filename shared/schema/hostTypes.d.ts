import { z } from 'zod';
export declare const HostEntityTypeSchema: z.ZodEnum<{
    business: "business";
    community: "community";
    venue: "venue";
    artist: "artist";
    professional: "professional";
    organiser: "organiser";
}>;
export type HostEntityType = z.infer<typeof HostEntityTypeSchema>;
//# sourceMappingURL=hostTypes.d.ts.map