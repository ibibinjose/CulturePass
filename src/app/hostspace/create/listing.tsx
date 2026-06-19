import { Redirect } from 'expo-router';

import { CULTURE_MARKET_LISTING_LAB_PATHNAME } from '@/constants/navigation/createNav';

/** Legacy `/hostspace/create/listing` → `/hostspace/listing`. */
export default function LegacyHostspaceCreateListingRedirect() {
  return <Redirect href={CULTURE_MARKET_LISTING_LAB_PATHNAME as never} />;
}