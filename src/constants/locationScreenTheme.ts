/** Australian flag palette — location onboarding accents (blue field + Commonwealth red). */
export const AU_FLAG_BLUE = '#012169';
export const AU_FLAG_RED = '#E4002B';

export type LocationScreenPalette = {
  blue: string;
  red: string;
  blueContainer: string;
  redContainer: string;
  /** Icon / glyph on blue-tinted surfaces */
  onBlueSurface: string;
  onBlueMuted: string;
  selectedBg: string;
  selectedText: string;
  /** Primary readable copy — always contrasts with page/card background */
  heading: string;
  body: string;
  bodyMuted: string;
  /** Visible panel outline on light/dark onboarding surfaces */
  panelBorder: string;
  /** Default card outline inside location pickers */
  cardBorder: string;
  gradient: [string, string];
};

export function getLocationScreenPalette(
  isDark: boolean,
  text: { primary: string; secondary: string; tertiary: string },
): LocationScreenPalette {
  return {
    blue: AU_FLAG_BLUE,
    red: AU_FLAG_RED,
    blueContainer: isDark ? '#0C1F4A' : '#DCE6F5',
    redContainer: isDark ? '#4A0C18' : '#FCE4E8',
    onBlueSurface: isDark ? '#F0F4FF' : AU_FLAG_BLUE,
    onBlueMuted: isDark ? '#B8C8E8' : '#2A4078',
    selectedBg: isDark ? '#0C1F4A' : '#DCE6F5',
    selectedText: isDark ? '#F0F4FF' : AU_FLAG_BLUE,
    heading: text.primary,
    body: text.secondary,
    bodyMuted: text.tertiary,
    panelBorder: isDark ? 'rgba(240, 244, 255, 0.28)' : 'rgba(1, 33, 105, 0.34)',
    cardBorder: isDark ? 'rgba(240, 244, 255, 0.18)' : 'rgba(1, 33, 105, 0.2)',
    gradient: [AU_FLAG_BLUE, AU_FLAG_RED],
  };
}