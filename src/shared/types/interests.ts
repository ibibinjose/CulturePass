/**
 * Interest-related types for the CulturePass onboarding flow
 */

export interface InterestCategory {
  id: string;
  name: string;
  emoji: string;
  interests: Interest[];
  accentColor?: string;
}

export interface Interest {
  id: string;
  name: string;
  categoryId: string;
  icon?: string;
  popularity?: number;
}