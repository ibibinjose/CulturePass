/**
 * Indigenous nation & First Nations tag presets for create flows and discovery.
 */

export interface IndigenousTagPreset {
  id: string;
  label: string;
  region: 'australia' | 'new_zealand' | 'pacific' | 'global';
  emoji: string;
}

export const INDIGENOUS_TAG_PRESETS: readonly IndigenousTagPreset[] = [
  { id: 'first_nations', label: 'First Nations', region: 'global', emoji: '🪶' },
  { id: 'aboriginal', label: 'Aboriginal', region: 'australia', emoji: '🪃' },
  { id: 'torres_strait', label: 'Torres Strait Islander', region: 'australia', emoji: '🌊' },
  { id: 'naidoc', label: 'NAIDOC', region: 'australia', emoji: '🟡' },
  { id: 'gadigal', label: 'Gadigal', region: 'australia', emoji: '🌿' },
  { id: 'wurundjeri', label: 'Wurundjeri', region: 'australia', emoji: '🌳' },
  { id: 'kaurna', label: 'Kaurna', region: 'australia', emoji: '🦘' },
  { id: 'whadjuk', label: 'Whadjuk Noongar', region: 'australia', emoji: '🌅' },
  { id: 'ngunnawal', label: 'Ngunnawal', region: 'australia', emoji: '🏔️' },
  { id: 'yolngu', label: 'Yolŋu', region: 'australia', emoji: '🎨' },
  { id: 'dreamtime', label: 'Dreamtime Stories', region: 'australia', emoji: '🌌' },
  { id: 'survival_day', label: 'Survival Day', region: 'australia', emoji: '🖤💛❤️' },
  { id: 'stolen_generations', label: 'Stolen Generations', region: 'australia', emoji: '🪶' },
  { id: 'maori', label: 'Māori', region: 'new_zealand', emoji: '🌀' },
  { id: 'ngati_whatua', label: 'Ngāti Whātua', region: 'new_zealand', emoji: '🌺' },
  { id: 'matariki', label: 'Matariki', region: 'new_zealand', emoji: '⭐' },
  { id: 'pacific_islander', label: 'Pacific Islander', region: 'pacific', emoji: '🌊' },
  { id: 'samoan', label: 'Samoan (Indigenous)', region: 'pacific', emoji: '🏝️' },
  { id: 'supply_nation', label: 'Supply Nation registered', region: 'australia', emoji: '✓' },
] as const;

export const INDIGENOUS_OWNED_LABEL = 'Indigenous-owned or led';

export function searchIndigenousTags(query: string): IndigenousTagPreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...INDIGENOUS_TAG_PRESETS];
  return INDIGENOUS_TAG_PRESETS.filter(
    (t) => t.label.toLowerCase().includes(q) || t.id.includes(q),
  );
}

export function indigenousTagLabel(id: string): string {
  const preset = INDIGENOUS_TAG_PRESETS.find((t) => t.id === id);
  if (preset) return preset.label;
  return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}