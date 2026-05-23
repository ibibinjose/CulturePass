import { Redirect } from 'expo-router';

import { CREATE_LAB_PATHNAME } from '@/constants/navigation/createNav';

/** `/create` → HostSpace Creation Lab (canonical). */
export default function CreateIndexRedirect() {
  return <Redirect href={CREATE_LAB_PATHNAME} />;
}
