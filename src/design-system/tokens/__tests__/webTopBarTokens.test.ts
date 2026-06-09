import {
  WEB_TOP_BAR,
  WEB_TOP_BAR_DARK_GRADIENT,
  WEB_TOP_BAR_SIGN_IN_GRADIENT,
} from '../webTopBarTokens';

describe('webTopBarTokens', () => {
  it('defines dark header and sign-in gradients', () => {
    expect(WEB_TOP_BAR_DARK_GRADIENT).toHaveLength(2);
    expect(WEB_TOP_BAR_SIGN_IN_GRADIENT).toHaveLength(2);
    for (const stop of WEB_TOP_BAR_DARK_GRADIENT) {
      expect(stop).toMatch(/^#/);
    }
  });

  it('defines accent and shadow chrome tokens', () => {
    expect(WEB_TOP_BAR.onAccent).toMatch(/^#/);
    expect(WEB_TOP_BAR.shadow).toMatch(/^#/);
  });
});