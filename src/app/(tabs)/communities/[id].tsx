import { useLocalSearchParams } from 'expo-router';

import { CommunityHubRedirect } from '@/modules/communities/components/detail/CommunityHubRedirect';

export default function CommunitiesDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CommunityHubRedirect href={`/community/${id}`} label="Opening community details..." />;
}
