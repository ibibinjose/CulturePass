import { useLocalSearchParams } from 'expo-router';

import { CommunityHubRedirect } from '@/modules/communities/components/detail/CommunityHubRedirect';

export default function CommunitiesMembersRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CommunityHubRedirect href={`/community/${id}/members`} label="Opening community members..." />;
}
