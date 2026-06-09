import { RETRO_STAMP_PALETTES } from '../savedScreenTokens';

describe('savedScreenTokens', () => {
  it('defines six retro stamp palettes with full color slots', () => {
    expect(RETRO_STAMP_PALETTES).toHaveLength(6);
    for (const palette of RETRO_STAMP_PALETTES) {
      expect(palette.text).toMatch(/^#/);
      expect(palette.border).toMatch(/^#/);
      expect(palette.bg).toMatch(/^#/);
      expect(palette.fill).toMatch(/^#/);
    }
  });
});