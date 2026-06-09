import { PROFILE_HERO_OVERLAY } from '../profileHeroOverlay';
import { BorderTokens } from '../theme';

describe('profileHeroOverlay', () => {
  it('uses token-backed hero text colors', () => {
    expect(PROFILE_HERO_OVERLAY.textPrimary).toBe(BorderTokens.white);
  });

  it('defines a three-stop hero scrim', () => {
    expect(PROFILE_HERO_OVERLAY.heroScrim).toHaveLength(3);
    expect(PROFILE_HERO_OVERLAY.heroScrim[0]).toContain('rgba');
  });
});