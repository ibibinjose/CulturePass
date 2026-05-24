import { z } from 'zod';

// ============================================================================
// HostSpace Enterprise-Grade Form System - Common Types
// ============================================================================

export const HostEntityTypeSchema = z.enum([
  'community',
  'organiser',
  'venue',
  'business',
  'artist',
  'professional',
]);

export type HostEntityType = z.infer<typeof HostEntityTypeSchema>;
