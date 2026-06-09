import {
  ACCOUNT_FLASH,
  AUTH_PROVIDER_GOOGLE,
  SETTINGS_ACCOUNT,
} from '../settingsAccountTokens';
import { BRAND_CYAN_DEEP } from '../brandCyanPalette';

describe('settingsAccountTokens', () => {
  it('defines account chrome and pulse glow', () => {
    expect(SETTINGS_ACCOUNT.pulseGlow).toBe(BRAND_CYAN_DEEP);
    expect(SETTINGS_ACCOUNT.modalBackdrop).toContain('rgba');
  });

  it('defines auth provider and flash palette slots', () => {
    expect(AUTH_PROVIDER_GOOGLE.icon).toMatch(/^#/);
    expect(ACCOUNT_FLASH.successIcon).toMatch(/^#/);
    expect(ACCOUNT_FLASH.errorIcon).toMatch(/^#/);
  });
});