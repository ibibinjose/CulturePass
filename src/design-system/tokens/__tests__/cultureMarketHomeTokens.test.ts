import { CULTURE_MARKET_HOME } from '../cultureMarketHomeTokens';
import { BorderTokens } from '../theme';

describe('cultureMarketHomeTokens', () => {
  it('defines hero and sell banner gradient stops', () => {
    expect(CULTURE_MARKET_HOME.heroGradient).toHaveLength(3);
    expect(CULTURE_MARKET_HOME.heroBg).toMatch(/^#/);
    expect(CULTURE_MARKET_HOME.sellCtaGradientEnd).toMatch(/^#/);
  });

  it('uses token-backed ink and tile fallback', () => {
    expect(CULTURE_MARKET_HOME.inkOnDark).toBe(BorderTokens.white);
    expect(CULTURE_MARKET_HOME.brandTileFallbackBg).toBe(BorderTokens.white);
  });
});