import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShortlinkPerkRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';
  if (!seg) return <Redirect href="/perks" />;
  return <Redirect href={`/perks/${encodeURIComponent(seg)}` as never} />;
}