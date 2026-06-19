import {
  hostspaceCreateHeroHeight,
  hostspaceHeroHeight,
  hostspaceScrollBottom,
  hostspaceShellSubtitle,
} from '@/components/hostspace/hostspaceLayout';

describe('hostspaceLayout', () => {
  test('hostspaceHeroHeight scales for desktop', () => {
    expect(hostspaceHeroHeight(true, false)).toBe(320);
    expect(hostspaceHeroHeight(false, false)).toBeGreaterThan(200);
  });

  test('hostspaceCreateHeroHeight is compact vs manage', () => {
    expect(hostspaceCreateHeroHeight(true)).toBeLessThan(hostspaceHeroHeight(true, false));
  });

  test('hostspaceScrollBottom includes safe area', () => {
    expect(hostspaceScrollBottom(34)).toBe(130);
  });

  test('hostspaceShellSubtitle reflects mode', () => {
    expect(hostspaceShellSubtitle('manage')).toBe('Manage');
    expect(hostspaceShellSubtitle('create', 'Events')).toBe('Creation Lab · Events');
    expect(hostspaceShellSubtitle('create-page')).toBe('Create a Page');
  });
});