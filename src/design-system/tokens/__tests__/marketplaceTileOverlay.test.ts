import { MARKETPLACE_TILE_OVERLAY } from '../marketplaceTileOverlay';
import { BorderTokens } from '../theme';

describe('marketplaceTileOverlay', () => {
  it('uses token-backed text on dark overlay', () => {
    expect(MARKETPLACE_TILE_OVERLAY.titleText).toBe(BorderTokens.white);
    expect(MARKETPLACE_TILE_OVERLAY.lockIcon).toBe(BorderTokens.white);
  });

  it('exposes gradient stops for tile captions', () => {
    expect(MARKETPLACE_TILE_OVERLAY.gradientBottom[0]).toBe('transparent');
    expect(MARKETPLACE_TILE_OVERLAY.gradientBottomStrong[1]).toContain('rgba');
  });
});