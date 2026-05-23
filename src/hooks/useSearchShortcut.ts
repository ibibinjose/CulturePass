/**
 * useSearchShortcut — focuses the global search input when "/" is pressed
 * on web, unless focus is already inside a text input, textarea, or
 * contenteditable element (Req 11.5, 11.6).
 *
 * Usage:
 *   useSearchShortcut(searchInputRef);
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

function isTextTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if (target.isContentEditable) return true;
  // React Native TextInput renders as an input inside a div
  const role = target.getAttribute('role');
  if (role === 'textbox' || role === 'searchbox') return true;
  return false;
}

/**
 * Focuses `inputRef.current` within 100ms when "/" is pressed and focus is
 * not already inside a text input (Req 11.5).
 *
 * @param inputRef - A ref to the HTMLInputElement to focus (web only)
 */
export function useSearchShortcut(
  inputRef: React.RefObject<HTMLInputElement | null>,
): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/') return;
      if (isTextTarget(document.activeElement)) return;

      event.preventDefault();

      // Focus within 100ms (Req 11.5)
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [inputRef]);
}
