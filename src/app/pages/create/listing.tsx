import { Redirect } from 'expo-router';

import { CULTURE_MARKET_LISTING_LAB_PATHNAME } from '@/constants/navigation/createNav';

/** Legacy `/pages/create/listing` → `/hostspace/listing`. */
export default function LegacyPagesCreateListingRedirect() {
  return <Redirect href={CULTURE_MARKET_LISTING_LAB_PATHNAME as never} />;
}