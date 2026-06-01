import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShortlinkActivityRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';
  if (!seg) return <Redirect href="/(tabs)" />;
  return <Redirect href={`/activities/${encodeURIComponent(seg)}` as never} />;
}
