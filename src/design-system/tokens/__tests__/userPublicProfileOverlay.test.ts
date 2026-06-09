import { USER_PUBLIC_PROFILE } from '../userPublicProfileOverlay';
import { BorderTokens } from '../theme';

describe('userPublicProfileOverlay', () => {
  it('uses token-backed QR and hero-on colors', () => {
    expect(USER_PUBLIC_PROFILE.qrForeground).toBe(BorderTokens.black);
    expect(USER_PUBLIC_PROFILE.onHero).toBe(BorderTokens.white);
  });

  it('defines CulturePass brand tricolor', () => {
    expect(USER_PUBLIC_PROFILE.brandCulture).toMatch(/^#/);
    expect(USER_PUBLIC_PROFILE.brandPass).toMatch(/^#/);
    expect(USER_PUBLIC_PROFILE.brandId).toMatch(/^#/);
  });
});