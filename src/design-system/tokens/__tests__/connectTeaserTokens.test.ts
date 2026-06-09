import { CONNECT_CARD_INK, CONNECT_FEATURE_FILLS, CONNECT_TEASER_SHADOW } from '../connectTeaserTokens';
import { BorderTokens } from '../theme';

describe('connectTeaserTokens', () => {
  it('defines five roadmap feature fills', () => {
    expect(Object.keys(CONNECT_FEATURE_FILLS)).toHaveLength(5);
    expect(CONNECT_FEATURE_FILLS.meetups).toMatch(/^#/);
  });

  it('uses token-backed contrast and shadow colors', () => {
    expect(CONNECT_CARD_INK.onDarkFill.primary).toBe(BorderTokens.white);
    expect(CONNECT_TEASER_SHADOW).toBe(BorderTokens.black);
  });
});