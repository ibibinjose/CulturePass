import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShortlinkUserRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';
  if (!seg) return <Redirect href="/(tabs)" />;
  return <Redirect href={`/user/${encodeURIComponent(seg)}` as never} />;
}

