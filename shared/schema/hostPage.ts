import { z } from 'zod';
import { AddressSchema, SocialLinkSchema } from './hostProfile';
import { HostEntityTypeSchema, type HostEntityType } from './hostTypes';

// ============================================================================
// Host Pages — Unified "Create a Page" system (Facebook-inspired architecture)
// Polymorphic pages for communities, venues, businesses, creators, etc.
// ============================================================================

/** Max heritage / discovery tag selections per list on host pages. */
export const HOST_PAGE_TAG_LIST_MAX = 12;

export const HOST_PAGE_CATEGORY_TAG_MAX = 3;

export const HostPageMembershipModelSchema = z.enum(['free', 'paid', 'invite-only']);
export type HostPageMembershipModel = z.infer<typeof HostPageMembershipModelSchema>;

export const HostPageCtaActionSchema = z.enum(['follow', 'join', 'book', 'contact']);
export type HostPageCtaAction = z.infer<typeof HostPageCtaActionSchema>;

export const HostPageTemplateIdSchema = z.enum([
  'diaspora-festival',
  'indie-venue',
  'cultural-creator',
  'community-hub',
  'professional-services',
  'custom',
]);
export type HostPageTemplateId = z.infer<typeof HostPageTemplateIdSchema>;

export const HostPageStatusSchema = z.enum([
  'draft',
  'published',
  'pending_verification',
  'suspended',
  'blocked',
]);
export type HostPageStatus = z.infer<typeof HostPageStatusSchema>;

export const HostPageVerificationStatusSchema = z.enum([
  'not_started',
  'pending',
  'verified',
  'rejected',
]);
export type HostPageVerificationStatus = z.infer<typeof HostPageVerificationStatusSchema>;

export const HostPagePrimaryContactMethodSchema = z.enum(['email', 'phone', 'whatsapp']);
export type HostPagePrimaryContactMethod = z.infer<typeof HostPagePrimaryContactMethodSchema>;

export const HostPageExecutiveRoleSchema = z.enum([
  'director',
  'executive',
  'secretary',
  'treasurer',
  'chair',
  'other',
]);
export type HostPageExecutiveRole = z.infer<typeof HostPageExecutiveRoleSchema>;

/** Director / executive member (manual entry — not CulturePass user invites) */
export const HostPageExecutiveMemberSchema = z.object({
  fullName: z.string().min(2).max(120).trim(),
  role: HostPageExecutiveRoleSchema.default('director'),
  title: z.string().max(80).optional(),
  email: z.string().email().optional().or(z.literal('')),
});
export type HostPageExecutiveMember = z.infer<typeof HostPageExecutiveMemberSchema>;

/** Lenient address for drafts; full AddressSchema enforced at publish for regulated types */
export const HostPageAddressDraftSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default('Australia'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  lgaCode: z.string().optional(),
  placeId: z.string().optional(),
  isPrimary: z.boolean().default(true),
});

const hostPageFormDataCoreSchema = z.object({
  /** Registered legal entity name (may differ from public page name) */
  registeredBusinessName: z.string().max(120).trim().optional(),
  tradingName: z.string().max(120).trim().optional(),
  categoryTags: z.array(z.string().min(1).max(40)).max(HOST_PAGE_CATEGORY_TAG_MAX).default([]),
  culturalTags: z.array(z.string().min(1).max(50)).max(HOST_PAGE_TAG_LIST_MAX).default([]),
  languageTags: z.array(z.string().min(1).max(50)).max(HOST_PAGE_TAG_LIST_MAX).default([]),
  nationalityId: z.string().max(40).optional(),
  cultureIds: z.array(z.string().max(40)).max(HOST_PAGE_TAG_LIST_MAX).default([]),
  indigenousTags: z.array(z.string().max(50)).max(HOST_PAGE_TAG_LIST_MAX).default([]),
  isIndigenousOwned: z.boolean().default(false),
  abn: z.string().optional(),
  gstRegistered: z.boolean().default(false),
  gstId: z.string().max(20).optional(),
  publicEmail: z.string().optional(),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  primaryContactMethod: HostPagePrimaryContactMethodSchema.default('email'),
  primaryAddress: HostPageAddressDraftSchema.optional(),
  isOnlineOnly: z.boolean().default(false),
  socialLinks: z.array(SocialLinkSchema).max(8).default([]),
  executiveMembers: z.array(HostPageExecutiveMemberSchema).max(12).default([]),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  membershipModel: HostPageMembershipModelSchema.default('free'),
  monthlyFeeCents: z.number().int().nonnegative().optional(),
  templateId: HostPageTemplateIdSchema.optional(),
  ctaLabel: z.string().max(40).optional(),
  ctaAction: HostPageCtaActionSchema.optional(),
});

/** Lenient wizard + autosave payload — allows partial name/bio while the user is still typing. */
export const HostPageDraftFormDataSchema = hostPageFormDataCoreSchema.extend({
  name: z.string().max(120).trim().default(''),
  bio: z.string().max(300).trim().default(''),
});

export type HostPageDraftFormData = z.infer<typeof HostPageDraftFormDataSchema>;

/** Stricter shape for create/update page records (not autosave). */
export const HostPageFormDataSchema = hostPageFormDataCoreSchema.extend({
  name: z.string().min(2).max(120).trim(),
  bio: z.string().min(10).max(300).trim(),
});

export type HostPageFormData = z.infer<typeof HostPageDraftFormDataSchema>;

/** Trim heritage tag arrays to API limits (draft autosave + legacy drafts). */
export function clampHostPageHeritageFields<T extends Partial<HostPageFormData>>(formData: T): T {
  const next = { ...formData };
  if (next.categoryTags) {
    next.categoryTags = next.categoryTags.slice(0, HOST_PAGE_CATEGORY_TAG_MAX);
  }
  if (next.culturalTags) {
    next.culturalTags = next.culturalTags.slice(0, HOST_PAGE_TAG_LIST_MAX);
  }
  if (next.languageTags) {
    next.languageTags = next.languageTags.slice(0, HOST_PAGE_TAG_LIST_MAX);
  }
  if (next.cultureIds) {
    next.cultureIds = next.cultureIds.slice(0, HOST_PAGE_TAG_LIST_MAX);
  }
  if (next.indigenousTags) {
    next.indigenousTags = next.indigenousTags.slice(0, HOST_PAGE_TAG_LIST_MAX);
  }
  return next;
}

/** Normalize + validate autosave payload after clamping heritage arrays. */
export function prepareHostPageDraftFormData(
  formData: Partial<HostPageFormData>,
): HostPageDraftFormData | null {
  const clamped = clampHostPageHeritageFields(formData);
  const parsed = HostPageDraftFormDataSchema.safeParse(clamped);
  return parsed.success ? parsed.data : null;
}

const ABN_DIGITS_REGEX = /^\d{11}$/;

function abnChecksumValid(abn: string): boolean {
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = abn.split('').map(Number);
  digits[0] -= 1;
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  return sum % 89 === 0;
}

export function hostPageRequiresAbn(entityType: HostEntityType): boolean {
  return entityType === 'business' || entityType === 'venue';
}

export function hostPageRequiresExecutiveMembers(entityType: HostEntityType): boolean {
  return entityType === 'business' || entityType === 'venue';
}

export function hostPageRequiresPhysicalAddress(entityType: HostEntityType): boolean {
  return entityType === 'venue';
}

/** Strict validation applied at publish time (pass entityType for regulated fields) */
export function validateHostPagePublishFormData(
  data: HostPageFormData,
  entityType: HostEntityType,
): { success: true } | { success: false; issues: { path: string; message: string }[] } {
  const issues: { path: string; message: string }[] = [];

  const base = HostPagePublishFormDataSchema.safeParse(data);
  if (!base.success) {
    for (const issue of base.error.issues) {
      issues.push({ path: issue.path.join('.'), message: issue.message });
    }
  }

  if (!data.publicEmail?.trim()) {
    issues.push({ path: 'publicEmail', message: 'Public contact email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.publicEmail)) {
    issues.push({ path: 'publicEmail', message: 'Enter a valid email address' });
  }

  if (hostPageRequiresAbn(entityType)) {
    const abn = (data.abn ?? '').replace(/\s/g, '');
    if (!ABN_DIGITS_REGEX.test(abn)) {
      issues.push({ path: 'abn', message: 'ABN must be 11 digits' });
    } else if (!abnChecksumValid(abn)) {
      issues.push({ path: 'abn', message: 'Invalid ABN checksum' });
    }
    if (!data.registeredBusinessName?.trim()) {
      issues.push({ path: 'registeredBusinessName', message: 'Registered business name is required' });
    }
  }

  if (data.gstRegistered && !data.gstId?.trim()) {
    issues.push({ path: 'gstId', message: 'GST ID is required when GST registered' });
  }

  if (hostPageRequiresExecutiveMembers(entityType) && (data.executiveMembers?.length ?? 0) < 1) {
    issues.push({
      path: 'executiveMembers',
      message: 'Add at least one director or executive member',
    });
  }

  const needsAddress = hostPageRequiresPhysicalAddress(entityType) && !data.isOnlineOnly;
  if (needsAddress) {
    const addr = data.primaryAddress;
    const parsed = AddressSchema.safeParse({
      street: addr?.street ?? '',
      city: addr?.city ?? '',
      state: addr?.state ?? '',
      postcode: addr?.postcode ?? '',
      country: addr?.country ?? 'Australia',
      latitude: addr?.latitude ?? 0,
      longitude: addr?.longitude ?? 0,
      lgaCode: addr?.lgaCode,
      placeId: addr?.placeId,
      isPrimary: true,
    });
    if (!parsed.success) {
      issues.push({ path: 'primaryAddress', message: 'A complete venue address is required' });
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }
  return { success: true };
}

/** Strict validation applied at publish time */
export const HostPagePublishFormDataSchema = HostPageFormDataSchema.extend({
  name: z.string().min(2).max(120).trim(),
  bio: z.string().min(20).max(300).trim(),
  categoryTags: z.array(z.string().min(1).max(40)).min(1).max(3),
  logoUrl: z.string().url(),
  coverUrl: z.string().url(),
}).superRefine((data, ctx) => {
  if (data.membershipModel === 'paid' && (data.monthlyFeeCents == null || data.monthlyFeeCents <= 0)) {
    ctx.addIssue({
      code: 'custom',
      path: ['monthlyFeeCents'],
      message: 'Paid membership requires a monthly fee greater than zero',
    });
  }
});

export const HostPageSchema = z.object({
  id: z.string(),
  entityType: HostEntityTypeSchema,
  ownerId: z.string(),
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  formData: HostPageFormDataSchema,
  status: HostPageStatusSchema.default('draft'),
  verificationStatus: HostPageVerificationStatusSchema.default('not_started'),
  /** Linked rich host profile (created on publish or later migration) */
  profileId: z.string().optional(),
  templateId: HostPageTemplateIdSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  lastModifiedBy: z.string(),
  blockedAt: z.string().optional(),
  blockedBy: z.string().optional(),
  blockReason: z.string().optional(),
});

export type HostPage = z.infer<typeof HostPageSchema>;

// ---------------------------------------------------------------------------
// Drafts (auto-save every 8s during Page Pro Wizard)
// ---------------------------------------------------------------------------

const hostPageDraftDeviceInfoSchema = z
  .object({
    platform: z.string(),
    userAgent: z.string(),
  })
  .optional();

export const HostPageDraftSchema = z.object({
  id: z.string(),
  userId: z.string(),
  pageId: z.string().optional(),
  entityType: HostEntityTypeSchema,
  formData: HostPageDraftFormDataSchema,
  currentStep: z.number().int().min(1).max(10),
  completedSteps: z.array(z.number().int().min(1).max(10)).default([]),
  templateId: HostPageTemplateIdSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string(),
  deviceInfo: hostPageDraftDeviceInfoSchema,
});

export type HostPageDraft = z.infer<typeof HostPageDraftSchema>;

export const CreateHostPageDraftSchema = HostPageDraftSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
});

export type CreateHostPageDraft = z.infer<typeof CreateHostPageDraftSchema>;

export const UpdateHostPageDraftSchema = z.object({
  id: z.string(),
  userId: z.string(),
  pageId: z.string().optional(),
  entityType: HostEntityTypeSchema.optional(),
  formData: HostPageDraftFormDataSchema.optional(),
  currentStep: z.number().int().min(1).max(10).optional(),
  completedSteps: z.array(z.number().int().min(1).max(10)).optional(),
  templateId: HostPageTemplateIdSchema.optional(),
  updatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  deviceInfo: hostPageDraftDeviceInfoSchema,
});

export type UpdateHostPageDraft = z.infer<typeof UpdateHostPageDraftSchema>;

export const CreateHostPageSchema = HostPageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export type CreateHostPage = z.infer<typeof CreateHostPageSchema>;

export const UpdateHostPageSchema = z.object({
  id: z.string(),
  entityType: HostEntityTypeSchema.optional(),
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  formData: HostPageFormDataSchema.optional(),
  status: HostPageStatusSchema.optional(),
  verificationStatus: HostPageVerificationStatusSchema.optional(),
  profileId: z.string().optional(),
  templateId: HostPageTemplateIdSchema.optional(),
  updatedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  blockedAt: z.string().optional(),
  blockedBy: z.string().optional(),
  blockReason: z.string().optional(),
});

export type UpdateHostPage = z.infer<typeof UpdateHostPageSchema>;

/** Entity types that require admin verification on publish */
export const HOST_PAGE_VERIFICATION_ENTITY_TYPES = [
  'organiser',
  'organizer',
  'venue',
  'business',
  'professional',
] as const;

export function hostPageRequiresVerification(entityType: z.infer<typeof HostEntityTypeSchema>): boolean {
  return (HOST_PAGE_VERIFICATION_ENTITY_TYPES as readonly string[]).includes(entityType);
}

/** Page-specific admin verification checklist (Create a Page flow) */
export const HOST_PAGE_VERIFICATION_CHECKLIST: Record<
  z.infer<typeof HostEntityTypeSchema>,
  readonly string[]
> = {
  community: [
    'Page name and bio are accurate and culturally appropriate',
    'Category tags match the community focus (max 3)',
    'Cultural and language tags are truthful',
    'Logo meets minimum 180×180 requirements',
    'Cover image meets minimum 820×312 requirements',
    'Membership model (free/paid/invite) is clearly stated',
    'Community guidelines intent is appropriate',
  ],
  organiser: [
    'Organiser brand name and bio verified',
    'Category tags reflect event production focus',
    'Logo and cover branding are authentic',
    'Cultural tags align with programming',
    'No misleading festival or ticketing claims',
    'Contact CTA is appropriate for organiser use',
    'Ready for event publishing under this Page',
  ],
  organizer: [
    'Organiser brand name and bio verified',
    'Category tags reflect event production focus',
    'Logo and cover branding are authentic',
    'Cultural tags align with programming',
    'No misleading festival or ticketing claims',
    'Contact CTA is appropriate for organiser use',
    'Ready for event publishing under this Page',
  ],
  venue: [
    'Venue name and location claims reviewed',
    'Physical address and ABN verified',
    'Directors / venue operators listed',
    'Public contact details verified',
    'Space type categories are accurate',
    'Logo and cover represent the physical venue',
    'Cultural programming tags verified',
    'Fire safety and licensing docs requested if needed',
  ],
  business: [
    'Business name and trading identity verified',
    'Registered business name and ABN cross-checked',
    'Directors / executive members listed and plausible',
    'Public email, phone, and address verified',
    'Category tags match commercial activity',
    'Logo and cover are authentic brand assets',
    'Social links reviewed for authenticity',
    'CultureMarket readiness reviewed',
  ],
  artist: [
    'Artist/creator name and bio verified',
    'Portfolio-ready branding (logo + cover) reviewed',
    'Genre and cultural tags are accurate',
    'No impersonation or copyright concerns',
    'Booking CTA is appropriate',
    'Language tags match performance/content',
    'Ready for creator directory listing',
  ],
  professional: [
    'Professional identity and credentials reviewed',
    'Expertise category tags are accurate',
    'Logo and cover present a trustworthy brand',
    'Rate/membership claims are not misleading',
    'Invite-only model justified if selected',
    'Cultural consultant positioning verified',
    'Contact CTA appropriate for B2B/pro services',
  ],
};

export function getHostPageVerificationChecklist(
  entityType: z.infer<typeof HostEntityTypeSchema>,
): { item: string; checked: boolean; notes?: string }[] {
  const items = HOST_PAGE_VERIFICATION_CHECKLIST[entityType] ?? HOST_PAGE_VERIFICATION_CHECKLIST.community;
  return items.map((item) => ({ item, checked: false }));
}