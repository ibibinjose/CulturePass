/**
 * Page Pro Wizard — dynamic step order per entity type
 */

import type { HostEntityType } from '@/shared/schema/hostTypes';

export const PAGE_WIZARD_STEP_IDS = [
  'basics',
  'tags',
  'business',
  'contact',
  'leadership',
  'branding',
  'membership',
  'preview',
] as const;

export type PageWizardStepId = (typeof PAGE_WIZARD_STEP_IDS)[number];

export const PAGE_WIZARD_STEP_LABELS: Record<PageWizardStepId, string> = {
  basics: 'Basics',
  tags: 'Tags',
  business: 'Business',
  contact: 'Contact',
  leadership: 'Leadership',
  branding: 'Branding',
  membership: 'Membership',
  preview: 'Preview',
};

export const PAGE_WIZARD_STEP_HINTS: Record<PageWizardStepId, string> = {
  basics: 'Page name, bio, and categories',
  tags: 'Heritage, audience tags, and languages',
  business: 'ABN, registration name, and tax',
  contact: 'Email, phone, address, and social',
  leadership: 'Directors and executive members',
  branding: 'Logo and cover image',
  membership: 'Membership model and primary CTA',
  preview: 'Review before publishing',
};

const REGULATED_FLOW: PageWizardStepId[] = [
  'basics',
  'tags',
  'business',
  'contact',
  'leadership',
  'branding',
  'membership',
  'preview',
];

const LIGHT_FLOW: PageWizardStepId[] = [
  'basics',
  'tags',
  'contact',
  'branding',
  'membership',
  'preview',
];

const ORGANISER_FLOW: PageWizardStepId[] = [
  'basics',
  'tags',
  'business',
  'contact',
  'leadership',
  'branding',
  'membership',
  'preview',
];

export function getPageWizardSteps(entityType: HostEntityType): PageWizardStepId[] {
  switch (entityType) {
    case 'business':
    case 'venue':
      return REGULATED_FLOW;
    case 'organiser':
    case 'organizer':
    case 'professional':
      return ORGANISER_FLOW;
    case 'community':
    case 'artist':
    default:
      return LIGHT_FLOW;
  }
}

export function getPageWizardStepLabel(stepId: PageWizardStepId): string {
  return PAGE_WIZARD_STEP_LABELS[stepId];
}

export function getPageWizardStepHint(stepId: PageWizardStepId): string {
  return PAGE_WIZARD_STEP_HINTS[stepId];
}