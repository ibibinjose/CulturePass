import {
  HOSTSPACE_EVENT_PREVIEW,
  HOSTSPACE_LEGACY_WIZARD_BANNER,
  HOSTSPACE_MUJI_FORM,
  HOSTSPACE_SPONSOR_TIER_COLORS,
} from '../hostspaceEventCreateTokens';
import { BorderTokens } from '../theme';

describe('hostspaceEventCreateTokens', () => {
  it('defines muji form and sponsor tier palettes', () => {
    expect(HOSTSPACE_MUJI_FORM.card).toMatch(/^#/);
    expect(Object.keys(HOSTSPACE_SPONSOR_TIER_COLORS)).toHaveLength(5);
    expect(HOSTSPACE_SPONSOR_TIER_COLORS.platinum).toMatch(/^#/);
  });

  it('uses token-backed ink and shadow colors', () => {
    expect(HOSTSPACE_MUJI_FORM.white).toBe(BorderTokens.white);
    expect(HOSTSPACE_EVENT_PREVIEW.inkOnDark).toBe(BorderTokens.white);
    expect(HOSTSPACE_EVENT_PREVIEW.shadow).toBe(BorderTokens.black);
    expect(HOSTSPACE_LEGACY_WIZARD_BANNER.ctaInk).toBe(BorderTokens.white);
  });
});