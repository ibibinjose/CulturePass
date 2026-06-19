import { Platform } from 'react-native';

/**
 * RN Web remaps `createElement('div', { accessibilityRole: 'button' })` to a native
 * `<button>`, which breaks HTML nesting (button-in-button, button wrapping input, etc.).
 * Use this for leaf pressables on web; keep semantic roles on native.
 */
export function pressableA11yRole(
  role: 'button' | 'link' | 'tab' | undefined,
): 'button' | 'link' | 'tab' | undefined {
  if (Platform.OS !== 'web') return role;
  if (role === 'button' || role === 'tab') return undefined;
  return role;
}