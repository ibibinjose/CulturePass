import { Redirect } from 'expo-router';

import { buildHostspaceCreateHref } from '@/constants/navigation/createNav';

export default function CreateIndexRedirect() {
  return <Redirect href={buildHostspaceCreateHref() as never} />;
}