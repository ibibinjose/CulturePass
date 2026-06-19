const REGION_TO_AU_CODE: Record<string, string> = {
  'new south wales': 'NSW',
  victoria: 'VIC',
  queensland: 'QLD',
  'western australia': 'WA',
  'south australia': 'SA',
  tasmania: 'TAS',
  'australian capital territory': 'ACT',
  'northern territory': 'NT',
};

const AU_STATE_CODES = new Set(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']);

/** Map full state names or codes to canonical AU state codes (NSW, VIC, …). */
export function toAuStateCode(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (AU_STATE_CODES.has(upper)) return upper;
  return REGION_TO_AU_CODE[trimmed.toLowerCase()];
}

export function isAustraliaCountry(value?: string | null): boolean {
  const c = String(value ?? '').trim().toLowerCase();
  return c === 'australia' || c === 'au' || c === '';
}