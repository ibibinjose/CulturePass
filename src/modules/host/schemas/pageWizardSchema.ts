/**
 * Page Pro Wizard — step-level Zod schemas for real-time validation
 */

import { z } from 'zod';
import {
  HostPageFormDataSchema,
  HostPageMembershipModelSchema,
  HostPageCtaActionSchema,
  HostPageTemplateIdSchema,
  HostPageExecutiveMemberSchema,
  hostPageRequiresAbn,
  hostPageRequiresExecutiveMembers,
  hostPageRequiresPhysicalAddress,
} from '@/shared/schema/hostPage';
import { SocialLinkSchema } from '@/shared/schema/hostProfile';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { abnSchema } from './profileSchema';
import type { PageWizardStepId } from '../config/pageWizardSteps';
import { getPageWizardSteps } from '../config/pageWizardSteps';

export { getPageWizardSteps, PAGE_WIZARD_STEP_LABELS } from '../config/pageWizardSteps';

const looseEmailSchema = z
  .string()
  .trim()
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address');

const loosePhoneSchema = z
  .string()
  .trim()
  .refine((v) => !v || /^\+?[0-9\s()-]{8,20}$/.test(v), 'Enter a valid phone number');

export const pageStepBasicsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120).trim(),
  bio: z
    .string()
    .min(10, 'Bio should be 1–2 sentences (at least 10 characters)')
    .max(300, 'Bio must be at most 300 characters')
    .trim(),
  registeredBusinessName: z.string().max(120).trim().optional(),
  tradingName: z.string().max(120).trim().optional(),
  categoryTags: z
    .array(z.string().min(1))
    .min(1, 'Select at least one category')
    .max(3, 'Select at most 3 categories'),
});

export const pageStepTagsSchema = z.object({
  culturalTags: z.array(z.string()).max(12).default([]),
  languageTags: z.array(z.string()).max(12).default([]),
  nationalityId: z.string().max(40).optional(),
  cultureIds: z.array(z.string()).max(12).default([]),
  indigenousTags: z.array(z.string()).max(12).default([]),
  isIndigenousOwned: z.boolean().default(false),
});

export const pageStepBusinessSchema = z.object({
  registeredBusinessName: z.string().max(120).trim().optional(),
  tradingName: z.string().max(120).trim().optional(),
  abn: z.string().optional(),
  gstRegistered: z.boolean().default(false),
  gstId: z.string().max(20).optional(),
});

export const pageStepContactSchema = z.object({
  publicEmail: looseEmailSchema.optional(),
  phoneNumber: loosePhoneSchema.optional(),
  whatsappNumber: loosePhoneSchema.optional(),
  primaryContactMethod: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  isOnlineOnly: z.boolean().default(false),
  primaryAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().default('Australia'),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      lgaCode: z.string().optional(),
      placeId: z.string().optional(),
    })
    .optional(),
  socialLinks: z.array(SocialLinkSchema).max(8).default([]),
});

export const pageStepLeadershipSchema = z.object({
  executiveMembers: z.array(HostPageExecutiveMemberSchema).max(12).default([]),
});

export const pageStepBrandingSchema = z.object({
  logoUrl: z.string().url('Logo is required').optional(),
  coverUrl: z.string().url('Cover image is required').optional(),
});

export const pageStepMembershipSchema = z
  .object({
    membershipModel: HostPageMembershipModelSchema,
    monthlyFeeCents: z.number().int().nonnegative().optional(),
    templateId: HostPageTemplateIdSchema.optional(),
    ctaLabel: z.string().max(40).optional(),
    ctaAction: HostPageCtaActionSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.membershipModel === 'paid' && (data.monthlyFeeCents == null || data.monthlyFeeCents <= 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthlyFeeCents'],
        message: 'Enter a monthly fee for paid membership',
      });
    }
  });

function businessStepSchemaFor(entityType: HostEntityType) {
  return pageStepBusinessSchema.superRefine((data, ctx) => {
    if (hostPageRequiresAbn(entityType)) {
      const abnResult = abnSchema.safeParse(data.abn ?? '');
      if (!abnResult.success) {
        ctx.addIssue({ code: 'custom', path: ['abn'], message: 'Valid ABN is required' });
      }
      if (!data.registeredBusinessName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['registeredBusinessName'],
          message: 'Registered business name is required',
        });
      }
    }
    if (data.gstRegistered && !data.gstId?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['gstId'], message: 'GST ID is required when GST registered' });
    }
  });
}

function contactStepSchemaFor(entityType: HostEntityType) {
  return pageStepContactSchema.superRefine((data, ctx) => {
    if (!data.publicEmail?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['publicEmail'], message: 'Public email is required' });
    }
    if (hostPageRequiresPhysicalAddress(entityType) && !data.isOnlineOnly) {
      const addr = data.primaryAddress;
      if (!addr?.street?.trim() || !addr?.city?.trim() || !addr?.state?.trim() || !addr?.postcode?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['primaryAddress'],
          message: 'Venue address is required (street, city, state, postcode)',
        });
      }
    }
  });
}

function leadershipStepSchemaFor(entityType: HostEntityType) {
  return pageStepLeadershipSchema.superRefine((data, ctx) => {
    if (hostPageRequiresExecutiveMembers(entityType) && (data.executiveMembers?.length ?? 0) < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['executiveMembers'],
        message: 'Add at least one director or executive member',
      });
    }
  });
}

export const pageWizardFormSchema = HostPageFormDataSchema;

export function getPageWizardStepSchema(stepId: PageWizardStepId, entityType: HostEntityType) {
  switch (stepId) {
    case 'basics':
      return pageStepBasicsSchema;
    case 'tags':
      return pageStepTagsSchema;
    case 'business':
      return businessStepSchemaFor(entityType);
    case 'contact':
      return contactStepSchemaFor(entityType);
    case 'leadership':
      return leadershipStepSchemaFor(entityType);
    case 'branding':
      return pageStepBrandingSchema;
    case 'membership':
      return pageStepMembershipSchema;
    case 'preview':
      return z.object({});
    default:
      return z.object({});
  }
}

/** Resolve schema by 1-based step index for the given entity type */
export function getPageWizardStepSchemaByIndex(stepIndex: number, entityType: HostEntityType) {
  const steps = getPageWizardSteps(entityType);
  const stepId = steps[stepIndex - 1];
  if (!stepId) return z.object({});
  return getPageWizardStepSchema(stepId, entityType);
}

export function getPageWizardTotalSteps(entityType: HostEntityType): number {
  return getPageWizardSteps(entityType).length;
}