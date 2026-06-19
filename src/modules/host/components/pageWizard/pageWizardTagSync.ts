/**
 * Keeps Page Pro `culturalTags` in sync with heritage picks + discovery presets.
 */
import { CULTURES } from '@/constants/cultures';
import { indigenousTagLabel } from '@/constants/indigenousTags';
import { HOST_PAGE_TAG_LIST_MAX } from '@/shared/schema/hostPage';
import type { HostPageFormData } from '@/shared/schema';
import { PAGE_CULTURAL_TAG_PRESETS } from '../../constants/pageTagPresets';

const DISCOVERY_PRESET_SET = new Set<string>(PAGE_CULTURAL_TAG_PRESETS);

export function discoveryCulturalTags(culturalTags: string[] | undefined): string[] {
  return (culturalTags ?? []).filter((tag) => DISCOVERY_PRESET_SET.has(tag));
}

type SyncCulturalTagsOpts = {
  cultureIds?: string[];
  indigenousTags?: string[];
  isIndigenousOwned?: boolean;
  discoveryTags?: string[];
};

function mergeSyncedCulturalTags(formData: HostPageFormData, opts: SyncCulturalTagsOpts = {}): string[] {
  const cultureIds = opts.cultureIds ?? formData.cultureIds ?? [];
  const indigenousTags = opts.indigenousTags ?? formData.indigenousTags ?? [];
  const discovery = opts.discoveryTags ?? discoveryCulturalTags(formData.culturalTags);

  const cultureLabels = cultureIds.map((id) => CULTURES[id]?.label ?? id);
  const indigenousLabels = indigenousTags
    .map(indigenousTagLabel)
    .filter((label) => label !== 'Indigenous');

  const merged = [...discovery, ...cultureLabels, ...indigenousLabels];
  const owned = opts.isIndigenousOwned ?? formData.isIndigenousOwned;
  if (owned || indigenousTags.length > 0) {
    merged.push('Indigenous');
  }

  return Array.from(new Set(merged));
}

export function canAddDiscoveryTag(
  formData: HostPageFormData,
  tag: string,
  discoveryTags?: string[],
): boolean {
  const current = discoveryTags ?? discoveryCulturalTags(formData.culturalTags);
  if (current.includes(tag)) return true;
  const nextDiscovery = [...current, tag];
  return mergeSyncedCulturalTags(formData, { discoveryTags: nextDiscovery }).length <= HOST_PAGE_TAG_LIST_MAX;
}

export function buildSyncedCulturalTags(
  formData: HostPageFormData,
  opts: SyncCulturalTagsOpts = {},
): string[] {
  return mergeSyncedCulturalTags(formData, opts).slice(0, HOST_PAGE_TAG_LIST_MAX);
}