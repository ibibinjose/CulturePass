import {
  PLUS_CARD_GRADIENT,
  PLUS_CARD_INK,
  PLUS_CARD_INK_DARK,
  UPGRADE_PROMO_ERROR,
  UPGRADE_PROMO_ERROR_SOFT,
} from '../membershipUpgradeTokens';

describe('membershipUpgradeTokens', () => {
  it('defines the Plus member card gradient stops', () => {
    expect(PLUS_CARD_GRADIENT).toHaveLength(5);
    for (const stop of PLUS_CARD_GRADIENT) {
      expect(stop).toMatch(/^#/);
    }
  });

  it('defines ink and promo error colors', () => {
    expect(PLUS_CARD_INK).toMatch(/^#/);
    expect(PLUS_CARD_INK_DARK).toMatch(/^#/);
    expect(UPGRADE_PROMO_ERROR).toMatch(/^#/);
    expect(UPGRADE_PROMO_ERROR_SOFT).toMatch(/^#[0-9A-Fa-f]{8}$/);
  });
});