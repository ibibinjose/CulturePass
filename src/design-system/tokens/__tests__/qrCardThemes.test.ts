import { describe, it, expect } from '@jest/globals';
import { resolveQrCardTheme, QR_CARD_THEMES } from '../qrCardThemes';

describe('qrCardThemes', () => {
  it('resolves known tiers', () => {
    expect(resolveQrCardTheme('elite').accent).toBe(QR_CARD_THEMES.elite.accent);
    expect(resolveQrCardTheme('PLUS').cardGradients).toEqual(QR_CARD_THEMES.plus.cardGradients);
  });

  it('maps aliases', () => {
    expect(resolveQrCardTheme('vip')).toEqual(QR_CARD_THEMES.elite);
    expect(resolveQrCardTheme('premium')).toEqual(QR_CARD_THEMES.plus);
  });

  it('falls back to free', () => {
    expect(resolveQrCardTheme('unknown-tier')).toEqual(QR_CARD_THEMES.free);
  });
});