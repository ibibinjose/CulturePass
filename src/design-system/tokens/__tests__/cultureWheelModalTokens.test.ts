import { CULTURE_WHEEL_MODAL, CULTURE_WHEEL_SLICE_COLORS } from '../cultureWheelModalTokens';
import { BorderTokens } from '../theme';

describe('cultureWheelModalTokens', () => {
  it('defines twelve wheel slice colors', () => {
    expect(Object.keys(CULTURE_WHEEL_SLICE_COLORS)).toHaveLength(12);
    expect(CULTURE_WHEEL_SLICE_COLORS.hubs).toMatch(/^#/);
  });

  it('uses token-backed ink and shadow colors', () => {
    expect(CULTURE_WHEEL_MODAL.inkOnSlice).toBe(BorderTokens.white);
    expect(CULTURE_WHEEL_MODAL.shadow).toBe(BorderTokens.black);
    expect(CULTURE_WHEEL_MODAL.spinGradient).toHaveLength(3);
  });
});