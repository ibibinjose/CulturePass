export type CultureCardEntityType = 'event' | 'business' | 'artist' | 'venue' | 'community';

export type CultureCardActionKind = 'save' | 'book' | 'message' | 'follow' | 'directions' | 'view';

export interface CultureCardPrimaryAction {
  kind: CultureCardActionKind;
  label: string;
  route: string;
}

export interface CultureCardTrust {
  isVerified?: boolean;
  socialProof?: string;
  qualityRank?: number;
}

export interface CultureCardModel {
  id: string;
  entityType: CultureCardEntityType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  meta?: string;
  trust: CultureCardTrust;
  primaryAction: CultureCardPrimaryAction;
}

export interface AdaptiveCultureRail {
  id: 'tonight' | 'weekend' | 'family' | 'free' | 'premium';
  title: string;
  subtitle: string;
  items: CultureCardModel[];
}
