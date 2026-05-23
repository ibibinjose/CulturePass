import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShortlinkCommunityMembersRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const seg = typeof id === 'string' ? id : '';
  if (!seg) return <Redirect href="/(tabs)/community" />;
  return <Redirect href={`/community/${encodeURIComponent(seg)}/members` as never} />;
}

