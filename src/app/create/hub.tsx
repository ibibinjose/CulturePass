import { Redirect } from 'expo-router';

import { CREATE_LAB_PATHNAME } from '@/constants/navigation/createNav';

/** Legacy `/create/hub` — same destination as `/create`. */
export default function CreateHubRedirect() {
  return <Redirect href={CREATE_LAB_PATHNAME} />;
}
