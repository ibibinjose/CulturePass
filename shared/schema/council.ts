/**
 * Australian LGA (council) as a location dimension — not a governance product surface.
 * Canonical rows live in Firestore `councils/` (see uploadCouncils script).
 */

export interface CouncilData {
  id: string;
  name: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';
  /** ABS LGA code — matches events/profiles/perks `lgaCode` for proximity. */
  lgaCode: string;
  websiteUrl?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  suburb: string;
  postcode: number;
  country: string;
  description?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  openingHours?: string;
  logoUrl?: string;
  bannerUrl?: string;
  socialLinks?: Partial<Record<'facebook' | 'instagram' | 'linkedin' | 'youtube', string>>;
  emergencyNumbers?: { label: string; phone: string }[];
}

/** API payload for signed-in LGA context (discover, calendar, perks). */
export interface CouncilLgaContext {
  council: CouncilData | null;
}

export interface CouncilListResponse {
  councils: CouncilData[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  source?: 'firestore' | 'mock';
}
