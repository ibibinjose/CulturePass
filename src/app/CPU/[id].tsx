import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Top-level branded route for CulturePass User (CPU) public profiles.
 * Preferred public URL format: https://culturepass.app/CPU/CP-U590D86
 *
 * This route takes precedence as a clean top-level path (not hidden in (shortlinks) group).
 * It redirects to the canonical user profile renderer, which handles full CPU branding
 * in the public link card, meta tags, and share sheets.
 */
export default function CPUProfileRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';

  if (!seg) {
    return <Redirect href="/(tabs)" />;
  }

  // Redirect to the main user profile page.
  // The profile page now prominently features the /CPU/ URL in the "Public profile" card
  // and uses it for og: tags when appropriate.
  return <Redirect href={`/user/${encodeURIComponent(seg)}` as never} />;
}
