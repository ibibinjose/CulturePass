import { PROFILE_STYLES } from '../profileStylesTokens';
import { BorderTokens } from '../theme';

describe('profileStylesTokens', () => {
  it('reuses border tokens for hero ink, shadows, and surfaces', () => {
    expect(PROFILE_STYLES.onHero).toBe(BorderTokens.white);
    expect(PROFILE_STYLES.surface).toBe(BorderTokens.white);
    expect(PROFILE_STYLES.shadow).toBe(BorderTokens.black);
  });
});