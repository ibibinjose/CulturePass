import { DISCOVER_HOME } from '../discoverHomeTokens';
import { BorderTokens } from '../theme';

describe('discoverHomeTokens', () => {
  it('defines CultureWheel promo gradients for light and dark', () => {
    expect(DISCOVER_HOME.wheelPromoGradientDark).toHaveLength(3);
    expect(DISCOVER_HOME.wheelPromoGradientLight).toHaveLength(3);
    expect(DISCOVER_HOME.wheelPromoGradientDark[0]).toMatch(/^#/);
  });

  it('uses token-backed ink, stroke, and shadow colors', () => {
    expect(DISCOVER_HOME.promoInk).toBe(BorderTokens.white);
    expect(DISCOVER_HOME.wheelBlueprintStroke).toBe(BorderTokens.white);
    expect(DISCOVER_HOME.shadow).toBe(BorderTokens.black);
  });
});