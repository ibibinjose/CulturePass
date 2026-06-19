import { Redirect } from 'expo-router';

import { buildHostspaceCreateHref } from '@/constants/navigation/createNav';

export default function ContentStudioRedirect() {
  return <Redirect href={buildHostspaceCreateHref() as never} />;
}