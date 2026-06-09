import { COMMUNITY_WEB_DESKTOP } from '../communityWebDesktopOverlay';
import { BorderTokens } from '../theme';

describe('communityWebDesktopOverlay', () => {
  it('uses token-backed hero and shadow colors', () => {
    expect(COMMUNITY_WEB_DESKTOP.onHero).toBe(BorderTokens.white);
    expect(COMMUNITY_WEB_DESKTOP.shadow).toBe(BorderTokens.black);
  });

  it('defines page gradient and hero scrim stops', () => {
    expect(COMMUNITY_WEB_DESKTOP.pageGradientLightStart).toMatch(/^#/);
    expect(COMMUNITY_WEB_DESKTOP.heroScrim).toHaveLength(3);
  });
});