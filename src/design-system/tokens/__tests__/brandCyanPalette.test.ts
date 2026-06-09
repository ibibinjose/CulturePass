import {
  BRAND_CYAN,
  BRAND_CYAN_DEEP,
  JET_BLACK,
  cyanAlpha,
  cyanDeepAlpha,
} from '../brandCyanPalette';

describe('brandCyanPalette', () => {
  it('defines the cyan + jet black brand colors', () => {
    expect(BRAND_CYAN).toBe('#00ADEF');
    expect(BRAND_CYAN_DEEP).toBe('#00A7EF');
    expect(JET_BLACK).toBe('#000000');
  });

  it('builds rgba helpers from cyan rgb tuples', () => {
    expect(cyanAlpha(0.18)).toBe('rgba(0, 173, 239, 0.18)');
    expect(cyanDeepAlpha(0.3)).toBe('rgba(0, 167, 239, 0.3)');
  });
});