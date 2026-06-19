import { isHostspaceCreateMode } from '../hostspacePanel';

describe('hostspacePanel', () => {
  test('detects explicit create panel', () => {
    expect(isHostspaceCreateMode({ panel: 'create' })).toBe(true);
  });

  test('detects create params without panel', () => {
    expect(isHostspaceCreateMode({ category: 'community' })).toBe(true);
    expect(isHostspaceCreateMode({ entityType: 'venue' })).toBe(true);
  });

  test('manage hub has no create params', () => {
    expect(isHostspaceCreateMode({})).toBe(false);
  });
});