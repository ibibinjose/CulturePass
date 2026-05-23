/**
 * CultureToday — dated cultural moments for the in-app celebration banner.
 * Windows use local calendar dates (month 1–12). Extend with `kind: 'fixed'` for
 * lunar/moveable holidays until a server-driven feed exists.
 */

export type CultureTodayWindow =
  | { kind: 'annual'; start: readonly [number, number]; end: readonly [number, number] }
  | { kind: 'fixed'; year: number; start: readonly [number, number]; end: readonly [number, number] };

export type CultureTodayMoment = {
  id: string;
  headline: string;
  message: string;
  learnMoreUrl?: string;
  /** Higher wins when multiple windows match the same day */
  priority?: number;
  windows: readonly CultureTodayWindow[];
};

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function windowStartMs(y: number, md: readonly [number, number]): number {
  return new Date(y, md[0] - 1, md[1]).getTime();
}

function windowEndMs(y: number, md: readonly [number, number]): number {
  return new Date(y, md[0] - 1, md[1], 23, 59, 59, 999).getTime();
}

export function dateMatchesWindow(d: Date, w: CultureTodayWindow): boolean {
  const t = startOfDay(d);
  if (w.kind === 'fixed') {
    if (d.getFullYear() !== w.year) return false;
    const a = windowStartMs(w.year, w.start);
    const b = windowEndMs(w.year, w.end);
    return t >= a && t <= b;
  }
  const y = d.getFullYear();
  const a = windowStartMs(y, w.start);
  const b = windowEndMs(y, w.end);
  return t >= a && t <= b;
}

export function effectiveYearForMoment(d: Date, moment: CultureTodayMoment): number {
  const fixed = moment.windows.find((w): w is Extract<CultureTodayWindow, { kind: 'fixed' }> => w.kind === 'fixed');
  if (fixed && dateMatchesWindow(d, fixed)) return fixed.year;
  return d.getFullYear();
}

function padMd(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** MM-DD for deep-linking to `/culture-today/[dayKey]` — uses the window that matches `when`, else first window start. */
export function getRepresentativeDayKeyForMoment(moment: CultureTodayMoment, when = new Date()): string {
  const matched = moment.windows.find((w) => dateMatchesWindow(when, w));
  const w = matched ?? moment.windows[0];
  if (!w) return '01-01';
  const [m, d] = w.start;
  return `${padMd(m)}-${padMd(d)}`;
}

export const CULTURE_TODAY_MOMENTS: readonly CultureTodayMoment[] = [
  {
    id: 'songkran',
    priority: 30,
    headline: 'Songkran & Southeast Asian New Year',
    message:
      'Mid-April marks the traditional New Year in Thailand (Songkran), Laos (Pi Mai), Cambodia, and Myanmar — water splashing symbolises washing away misfortune, with family reunions and temple visits at the heart of the festival.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Songkran',
    windows: [{ kind: 'annual', start: [4, 13], end: [4, 15] }],
  },
  {
    id: 'chinese_new_year_2026',
    priority: 40,
    headline: 'Lunar New Year',
    message:
      'Lunar New Year is observed across Chinese diaspora communities with reunion feasts, red envelopes, lion dances, and fireworks — a celebration of renewal and family ties.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Chinese_New_Year',
    windows: [{ kind: 'fixed', year: 2026, start: [2, 14], end: [2, 22] }],
  },
  {
    id: 'chinese_new_year_2027',
    priority: 40,
    headline: 'Lunar New Year',
    message:
      'Lunar New Year is observed across Chinese diaspora communities with reunion feasts, red envelopes, lion dances, and fireworks — a celebration of renewal and family ties.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Chinese_New_Year',
    windows: [{ kind: 'fixed', year: 2027, start: [2, 4], end: [2, 12] }],
  },
  {
    id: 'chinese_new_year_2028',
    priority: 40,
    headline: 'Lunar New Year',
    message:
      'Lunar New Year is observed across Chinese diaspora communities with reunion feasts, red envelopes, lion dances, and fireworks — a celebration of renewal and family ties.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Chinese_New_Year',
    windows: [{ kind: 'fixed', year: 2028, start: [1, 23], end: [1, 31] }],
  },
  {
    id: 'christmas',
    priority: 20,
    headline: 'Christmas',
    message:
      'Christmas is celebrated by Christian communities worldwide with carols, gift-giving, and gatherings — many diaspora cities host night markets, midnight Mass, and multicultural street festivals.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Christmas',
    windows: [{ kind: 'annual', start: [12, 24], end: [12, 26] }],
  },
  {
    id: 'easter_2026',
    priority: 25,
    headline: 'Easter',
    message:
      'Easter marks the resurrection in the Christian calendar — many cultures blend sacred observance with spring fairs, egg hunts, and shared meals across the long weekend.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Easter',
    windows: [{ kind: 'fixed', year: 2026, start: [4, 3], end: [4, 6] }],
  },
  {
    id: 'easter_2027',
    priority: 25,
    headline: 'Easter',
    message:
      'Easter marks the resurrection in the Christian calendar — many cultures blend sacred observance with spring fairs, egg hunts, and shared meals across the long weekend.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Easter',
    windows: [{ kind: 'fixed', year: 2027, start: [3, 26], end: [3, 29] }],
  },
  {
    id: 'onam_2026',
    priority: 28,
    headline: 'Onam',
    message:
      'Onam is Kerala’s harvest homecoming — pookkalam flower carpets, Onasadya feasts, Vallamkali boat races, and Pulikali processions welcome the mythical King Mahabali across Malayali communities.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Onam',
    windows: [{ kind: 'fixed', year: 2026, start: [9, 6], end: [9, 11] }],
  },
  {
    id: 'holi_2026',
    priority: 22,
    headline: 'Holi',
    message:
      'Holi welcomes spring with colour, music, and sweets — communities gather to throw powdered pigment and share thandai in a joyful celebration of renewal and togetherness.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Holi',
    windows: [{ kind: 'fixed', year: 2026, start: [3, 12], end: [3, 15] }],
  },
  {
    id: 'vaisakhi_2026',
    priority: 24,
    headline: 'Vaisakhi',
    message:
      'Vaisakhi marks the Sikh New Year and spring harvest across Punjab and the diaspora — nagar kirtan processions, langar, and bright dress honour community courage and gratitude.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Vaisakhi',
    windows: [{ kind: 'fixed', year: 2026, start: [4, 13], end: [4, 14] }],
  },
  {
    id: 'tamil_new_year_2026',
    priority: 23,
    headline: 'Tamil New Year (Puthandu)',
    message:
      'Puthandu opens the Tamil month of Chithirai with kolam art, temple visits, and feasts — families wish for prosperity and fresh beginnings across Tamil Nadu and the diaspora.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Puthandu',
    windows: [{ kind: 'fixed', year: 2026, start: [4, 14], end: [4, 15] }],
  },
  {
    id: 'vishu_2026',
    priority: 23,
    headline: 'Vishu',
    message:
      'Vishu is the Malayalam New Year in Kerala — the Vishukkani arrangement of auspicious items and shared sadya meals focus on abundance, light, and looking forward together.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Vishu',
    windows: [{ kind: 'fixed', year: 2026, start: [4, 14], end: [4, 15] }],
  },
] as const;

export function getActiveCultureTodayMoment(now = new Date()): CultureTodayMoment | null {
  const hits: CultureTodayMoment[] = [];
  for (const m of CULTURE_TODAY_MOMENTS) {
    if (m.windows.some((w) => dateMatchesWindow(now, w))) hits.push(m);
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return hits[0] ?? null;
}
