import { Platform } from 'react-native';

export type HostspaceShellMode = 'manage' | 'create' | 'create-page' | 'wizard';

export function hostspaceHeroHeight(isDesktop: boolean, isExpanded: boolean): number {
  if (isDesktop) return 320;
  if (isExpanded) return 300;
  return Platform.OS === 'web' ? 280 : 260;
}

export function hostspaceCreateHeroHeight(isDesktop: boolean): number {
  return isDesktop ? 260 : 220;
}

/** Bottom spacer for HostSpace hub routes (no tab bar). */
export function hostspaceScrollBottom(safeBottom: number): number {
  return safeBottom + 96;
}

export function hostspaceShellSubtitle(mode: HostspaceShellMode, categoryLabel?: string): string {
  switch (mode) {
    case 'manage':
      return 'Manage';
    case 'create':
      return categoryLabel ? `Creation Lab · ${categoryLabel}` : 'Creation Lab';
    case 'create-page':
      return 'Create a Page';
    case 'wizard':
      return 'Editor';
    default:
      return 'HostSpace';
  }
}