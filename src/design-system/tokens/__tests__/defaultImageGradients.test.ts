import { DEFAULT_IMAGE_GRADIENTS } from '../defaultImageGradients';

describe('defaultImageGradients', () => {
  it('defines twelve gradient placeholder pairs', () => {
    expect(Object.keys(DEFAULT_IMAGE_GRADIENTS)).toHaveLength(12);
    for (const pair of Object.values(DEFAULT_IMAGE_GRADIENTS)) {
      expect(pair).toHaveLength(2);
      expect(pair[0]).toMatch(/^#/);
      expect(pair[1]).toMatch(/^#/);
    }
  });
});