import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShortlinkCommunityRedirect() {
  const params = useLocalSearchParams<{ id?: string; tab?: string }>();
  const seg = typeof params.id === 'string' ? params.id : '';
  if (!seg) return <Redirect href="/(tabs)/community" />;
  const qs = params.tab && (params.tab === 'events' || params.tab === 'members')
    ? `?tab=${encodeURIComponent(params.tab)}`
    : '';
  return <Redirect href={`/community/${encodeURIComponent(seg)}${qs}` as never} />;
}
