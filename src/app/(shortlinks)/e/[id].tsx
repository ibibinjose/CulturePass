import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShortlinkEventRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';
  if (!seg) return <Redirect href="/(tabs)" />;
  return <Redirect href={`/event/${encodeURIComponent(seg)}` as never} />;
}

