import type { HostEntityType, HostPageTemplateId } from '@/shared/schema';

export interface PageTemplateConfig {
  id: HostPageTemplateId;
  title: string;
  description: string;
  icon: string;
  entityType: HostEntityType;
  preset: {
    categoryTags: string[];
    culturalTags: string[];
    languageTags: string[];
    membershipModel: 'free' | 'paid' | 'invite-only';
    ctaLabel: string;
    ctaAction: 'follow' | 'join' | 'book' | 'contact';
    bioHint: string;
  };
}

export const PAGE_TEMPLATES: PageTemplateConfig[] = [
  {
    id: 'diaspora-festival',
    title: 'Diaspora Festival',
    description: 'Pre-filled for event organisers and cultural producers',
    icon: 'calendar',
    entityType: 'organiser',
    preset: {
      categoryTags: ['Festivals', 'Cultural Events'],
      culturalTags: ['Multicultural', 'Indian'],
      languageTags: ['English'],
      membershipModel: 'free',
      ctaLabel: 'Follow',
      ctaAction: 'follow',
      bioHint: 'Tell diaspora audiences what festivals and experiences you produce.',
    },
  },
  {
    id: 'indie-venue',
    title: 'Indie Venue',
    description: 'For grassroots stages, galleries, and cultural spaces',
    icon: 'location',
    entityType: 'venue',
    preset: {
      categoryTags: ['Venue', 'Live Music'],
      culturalTags: ['Multicultural'],
      languageTags: ['English'],
      membershipModel: 'free',
      ctaLabel: 'Book',
      ctaAction: 'book',
      bioHint: 'Describe your space, capacity, and the cultural nights you host.',
    },
  },
  {
    id: 'cultural-creator',
    title: 'Cultural Creator',
    description: 'Artist, maker, or performer profile',
    icon: 'person',
    entityType: 'artist',
    preset: {
      categoryTags: ['Artist', 'Music'],
      culturalTags: ['Multicultural'],
      languageTags: ['English'],
      membershipModel: 'free',
      ctaLabel: 'Follow',
      ctaAction: 'follow',
      bioHint: 'Share your craft, heritage, and what makes your work unique.',
    },
  },
  {
    id: 'community-hub',
    title: 'Community Hub',
    description: 'Diaspora association or member community',
    icon: 'people',
    entityType: 'community',
    preset: {
      categoryTags: ['Community', 'Heritage'],
      culturalTags: ['Multicultural', 'Family-Friendly'],
      languageTags: ['English'],
      membershipModel: 'free',
      ctaLabel: 'Join',
      ctaAction: 'join',
      bioHint: 'Introduce your community and who it serves.',
    },
  },
  {
    id: 'professional-services',
    title: 'Professional Services',
    description: 'Freelancer, expert, or cultural consultant',
    icon: 'school',
    entityType: 'professional',
    preset: {
      categoryTags: ['Professional', 'Consultant'],
      culturalTags: ['Multicultural'],
      languageTags: ['English'],
      membershipModel: 'invite-only',
      ctaLabel: 'Contact',
      ctaAction: 'contact',
      bioHint: 'Summarise your expertise and how you help diaspora communities.',
    },
  },
];

export function getPageTemplate(id: HostPageTemplateId): PageTemplateConfig | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}