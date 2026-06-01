import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Branded shortlink for CulturePass User profiles.
 * e.g. https://culturepass.app/CPU/CP-U590D86
 */
export default function ShortlinkCPUUserRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';
  if (!seg) return <Redirect href="/(tabs)" />;
  return <Redirect href={`/user/${encodeURIComponent(seg)}` as never} />;
}
