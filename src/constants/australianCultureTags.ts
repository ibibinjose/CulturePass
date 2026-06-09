/**
 * Australian culture tags — values, lifestyle, heritage, and expression.
 * Powers discovery filters, event tagging, and the Australian nationality picker.
 */

export type AustralianCultureCategoryId =
  | 'core_values'
  | 'lifestyle'
  | 'heritage'
  | 'entertainment'
  | 'more';

export interface AustralianCultureTag {
  id: string;
  label: string;
  emoji: string;
  /** Lowercase slug stored on events as cultureTag / cultureTags */
  cultureTag: string;
  categoryId: AustralianCultureCategoryId;
  description?: string;
}

export interface AustralianCultureCategory {
  id: AustralianCultureCategoryId;
  label: string;
  emoji: string;
}

export const AUSTRALIAN_CULTURE_CATEGORIES: readonly AustralianCultureCategory[] = [
  { id: 'core_values', label: 'Core Values & Identity', emoji: '🤝' },
  { id: 'lifestyle', label: 'Lifestyle & Everyday Living', emoji: '☀️' },
  { id: 'heritage', label: 'Heritage & Diversity', emoji: '🪃' },
  { id: 'entertainment', label: 'Entertainment & Expression', emoji: '🎸' },
  { id: 'more', label: 'More Australian Culture', emoji: '🇦🇺' },
] as const;

export const AUSTRALIAN_CULTURE_TAGS: readonly AustralianCultureTag[] = [
  // Core Values & Identity
  { id: 'australian', label: 'Australian', emoji: '🇦🇺', cultureTag: 'australian', categoryId: 'core_values', description: 'Broad Australian national culture and identity' },
  { id: 'mateship', label: 'Mateship', emoji: '🤝', cultureTag: 'mateship', categoryId: 'core_values', description: 'Loyalty, friendship, and mutual solidarity' },
  { id: 'fair_go', label: 'Fair Go', emoji: '⚖️', cultureTag: 'fair go', categoryId: 'core_values', description: 'Equal opportunity for everyone' },
  { id: 'anti_tall_poppy', label: 'Anti-Tall Poppy', emoji: '🌾', cultureTag: 'anti-tall poppy', categoryId: 'core_values', description: 'Dislike of arrogance and excessive self-importance' },
  { id: 'no_worries', label: 'No Worries', emoji: '😎', cultureTag: 'no worries', categoryId: 'core_values', description: 'Relaxed, optimistic approach to challenges' },
  { id: 'egalitarianism', label: 'Egalitarianism', emoji: '🫱🏽‍🫲🏻', cultureTag: 'egalitarianism', categoryId: 'core_values', description: 'Social equality and rejection of class divisions' },

  // Lifestyle & Everyday Living
  { id: 'barbie_culture', label: 'Barbie Culture', emoji: '🔥', cultureTag: 'barbie', categoryId: 'lifestyle', description: 'Backyard and park barbecues' },
  { id: 'cafe_culture', label: 'Cafe Culture', emoji: '☕', cultureTag: 'cafe culture', categoryId: 'lifestyle', description: 'Artisanal coffee and brunch habits' },
  { id: 'beach_culture', label: 'Beach Culture', emoji: '🏖️', cultureTag: 'beach culture', categoryId: 'lifestyle', description: 'Coastal living, swimming, and surf lifesaving' },
  { id: 'pub_culture', label: 'Pub Culture', emoji: '🍺', cultureTag: 'pub culture', categoryId: 'lifestyle', description: 'Local hotels, beer gardens, and socialising' },
  { id: 'diy_bunnings', label: 'DIY & Bunnings', emoji: '🔧', cultureTag: 'diy bunnings', categoryId: 'lifestyle', description: 'Weekend home improvement and sausage sizzles' },
  { id: 'coastal_living', label: 'Coastal Living', emoji: '🌊', cultureTag: 'coastal living', categoryId: 'lifestyle', description: 'Life by the water — surf, sand, and seaside towns' },
  { id: 'outback_bush', label: 'Outback & Bush', emoji: '🦘', cultureTag: 'outback bush', categoryId: 'lifestyle', description: 'Red dirt, wide horizons, and bush traditions' },
  { id: 'rural_country', label: 'Rural & Country Life', emoji: '🚜', cultureTag: 'rural country', categoryId: 'lifestyle', description: 'Farming communities, country towns, and regional fairs' },

  // Heritage & Diversity
  { id: 'indigenous_heritage_au', label: 'Indigenous Heritage', emoji: '🪃', cultureTag: 'indigenous heritage', categoryId: 'heritage', description: '65,000+ years of Aboriginal and Torres Strait Islander culture' },
  { id: 'dreamtime', label: 'Dreamtime Stories', emoji: '🌌', cultureTag: 'dreamtime', categoryId: 'heritage', description: 'Traditional Indigenous spiritual beliefs and creation histories' },
  { id: 'australian_multiculturalism', label: 'Multiculturalism', emoji: '🌏', cultureTag: 'australian multiculturalism', categoryId: 'heritage', description: 'Modern Australia shaped by waves of global migration' },
  { id: 'anzac_legend', label: 'ANZAC Legend', emoji: '🌺', cultureTag: 'anzac', categoryId: 'heritage', description: 'Military history defining national courage and sacrifice' },
  { id: 'bushranger_lore', label: 'Bush Ranger Lore', emoji: '🤠', cultureTag: 'bushranger', categoryId: 'heritage', description: 'Historical fascination with outlaws like Ned Kelly' },
  { id: 'first_fleet_colonial', label: 'Colonial & Convict History', emoji: '⛵', cultureTag: 'colonial history', categoryId: 'heritage', description: 'Settlement, convict past, and early colonial heritage' },
  { id: 'gold_rush', label: 'Gold Rush Heritage', emoji: '⛏️', cultureTag: 'gold rush', categoryId: 'heritage', description: 'Ballarat, Bendigo, and the rush that reshaped the nation' },
  { id: 'survival_day', label: 'Survival Day & January 26', emoji: '🖤💛❤️', cultureTag: 'survival day', categoryId: 'heritage', description: 'Reflection on invasion, survival, and changing the date' },

  // Entertainment & Expression
  { id: 'aussie_slang', label: 'Aussie Slang', emoji: '💬', cultureTag: 'aussie slang', categoryId: 'entertainment', description: 'Abbreviations, diminutives, and unique idioms' },
  { id: 'larrikinism', label: 'Larrikinism', emoji: '🃏', cultureTag: 'larrikinism', categoryId: 'entertainment', description: 'Irreverent, non-conformist humour' },
  { id: 'afl_nrl', label: 'AFL & NRL', emoji: '🏉', cultureTag: 'afl nrl', categoryId: 'entertainment', description: 'Deep regional loyalties to rival football codes' },
  { id: 'cricket_surfing', label: 'Cricket & Surfing', emoji: '🏄', cultureTag: 'cricket surfing', categoryId: 'entertainment', description: 'Defining summer sports and outdoor recreation' },
  { id: 'pub_rock', label: 'Pub Rock', emoji: '🎸', cultureTag: 'pub rock', categoryId: 'entertainment', description: 'Gritty, live homegrown rock music history' },
  { id: 'aussie_comedy', label: 'Comedy & Satire', emoji: '🎤', cultureTag: 'aussie comedy', categoryId: 'entertainment', description: 'Stand-up, sketch, and laconic national humour' },
  { id: 'bush_poetry', label: 'Bush Poetry & Ballads', emoji: '📜', cultureTag: 'bush poetry', categoryId: 'entertainment', description: 'Banjo Paterson, bush ballads, and outback verse' },
  { id: 'aussie_country_music', label: 'Australian Country Music', emoji: '🤠', cultureTag: 'aussie country music', categoryId: 'entertainment', description: 'Country, bush ballads, and regional music scenes' },

  // More Australian Culture
  { id: 'surf_lifesaving', label: 'Surf Life Saving', emoji: '🟥🟡', cultureTag: 'surf lifesaving', categoryId: 'more', description: 'Flags, patrols, and coastal volunteer culture' },
  { id: 'footy_culture', label: 'Footy Culture', emoji: '🏈', cultureTag: 'footy culture', categoryId: 'more', description: 'Finals fever, local clubs, and code rivalries' },
  { id: 'christmas_beach', label: 'Christmas at the Beach', emoji: '🎄', cultureTag: 'christmas beach', categoryId: 'more', description: 'Summer holidays, prawns, and coastal Christmas' },
  { id: 'wine_regions', label: 'Wine & Regional Food', emoji: '🍷', cultureTag: 'wine regions', categoryId: 'more', description: 'Barossa, Yarra, Margaret River, and cellar doors' },
  { id: 'farmers_markets', label: 'Farmers Markets', emoji: '🧺', cultureTag: 'farmers markets', categoryId: 'more', description: 'Regional produce, artisan stalls, and community markets' },
  { id: 'ute_akubra', label: 'Utes & Akubra Culture', emoji: '🛻', cultureTag: 'ute akubra', categoryId: 'more', description: 'Tradie utes, wide-brim hats, and rural practicality' },
  { id: 'melbourne_cup', label: 'Racing & Cup Culture', emoji: '🏇', cultureTag: 'melbourne cup', categoryId: 'more', description: 'Melbourne Cup, country races, and carnival fashion' },
  { id: 'bushwalking_nature', label: 'Bushwalking & Nature', emoji: '🥾', cultureTag: 'bushwalking', categoryId: 'more', description: 'National parks, bushwalks, and outdoor adventure' },
  { id: 'community_resilience', label: 'Community Resilience', emoji: '💪', cultureTag: 'community resilience', categoryId: 'more', description: 'Neighbours helping neighbours through floods and fire' },
  { id: 'aussie_food_icons', label: 'Aussie Food Icons', emoji: '🥧', cultureTag: 'aussie food', categoryId: 'more', description: 'Meat pies, lamingtons, pavlova, and classic tuckshop fare' },
] as const;

export const AUSTRALIAN_CULTURE_IDS = AUSTRALIAN_CULTURE_TAGS.map((tag) => tag.id);

/** Leaf culture rows merged into `CULTURES` under nationality `australian`. */
export function buildAustralianCultureEntries(): Array<{
  id: string;
  label: string;
  emoji: string;
  nationalityId: 'australian';
  primaryLanguageId: string;
}> {
  return AUSTRALIAN_CULTURE_TAGS.map((tag) => ({
    id: tag.id,
    label: tag.label,
    emoji: tag.emoji,
    nationalityId: 'australian' as const,
    primaryLanguageId: 'eng',
  }));
}

export function getAustralianTagsByCategory(categoryId: AustralianCultureCategoryId): AustralianCultureTag[] {
  return AUSTRALIAN_CULTURE_TAGS.filter((tag) => tag.categoryId === categoryId);
}

export function searchAustralianCultureTags(query: string): AustralianCultureTag[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...AUSTRALIAN_CULTURE_TAGS];
  return AUSTRALIAN_CULTURE_TAGS.filter(
    (tag) =>
      tag.label.toLowerCase().includes(needle) ||
      tag.cultureTag.includes(needle) ||
      (tag.description?.toLowerCase().includes(needle) ?? false),
  );
}

export function australianCultureTagLabels(): string[] {
  return AUSTRALIAN_CULTURE_TAGS.map((tag) => tag.label);
}

export const AUSTRALIAN_FIRST_NATIONS_CULTURE_IDS = ['aboriginal_australian', 'torres_strait'] as const;

export interface AustralianCultureSectionCulture {
  id: string;
  label: string;
  emoji: string;
}

export interface AustralianCultureSection {
  id: string;
  label: string;
  emoji: string;
  cultures: AustralianCultureSectionCulture[];
}

function cultureMatchesQuery(
  culture: AustralianCultureSectionCulture,
  needle: string,
): boolean {
  if (!needle) return true;
  const tag = AUSTRALIAN_CULTURE_TAGS.find((entry) => entry.id === culture.id);
  return (
    culture.label.toLowerCase().includes(needle) ||
    culture.id.includes(needle) ||
    (tag?.cultureTag.includes(needle) ?? false) ||
    (tag?.description?.toLowerCase().includes(needle) ?? false)
  );
}

/** Group Australian nationality cultures into labeled sections for create-flow UIs. */
export function buildAustralianCultureSections(
  pool: readonly AustralianCultureSectionCulture[],
  searchQuery = '',
): AustralianCultureSection[] {
  const needle = searchQuery.trim().toLowerCase();
  const sections: AustralianCultureSection[] = [];

  const firstNations = pool.filter(
    (culture) =>
      (AUSTRALIAN_FIRST_NATIONS_CULTURE_IDS as readonly string[]).includes(culture.id) &&
      cultureMatchesQuery(culture, needle),
  );
  if (firstNations.length > 0) {
    sections.push({
      id: 'first_nations',
      label: 'First Nations',
      emoji: '🪃',
      cultures: firstNations,
    });
  }

  for (const category of AUSTRALIAN_CULTURE_CATEGORIES) {
    const tagIds = new Set(
      AUSTRALIAN_CULTURE_TAGS.filter((tag) => tag.categoryId === category.id).map((tag) => tag.id),
    );
    const cultures = pool.filter(
      (culture) => tagIds.has(culture.id) && cultureMatchesQuery(culture, needle),
    );
    if (cultures.length > 0) {
      sections.push({
        id: category.id,
        label: category.label,
        emoji: category.emoji,
        cultures,
      });
    }
  }

  return sections;
}

export function isAustralianNationality(nationalityId: string | null | undefined): boolean {
  return nationalityId === 'australian';
}

/** Firestore cultureTag values for a culture id (id + search slug when they differ). */
export function cultureIdToStoredTags(cultureId: string): string[] {
  const au = AUSTRALIAN_CULTURE_TAGS.find((tag) => tag.id === cultureId);
  if (!au) return [cultureId];
  if (au.cultureTag === cultureId) return [cultureId];
  return [cultureId, au.cultureTag];
}