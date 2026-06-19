import { Redirect } from 'expo-router';

/** Legacy /profile/public — public profiles live at /cpu/[id]; members use /profile/digital-id */
export default function ProfilePublicRedirect() {
  return <Redirect href="/profile/digital-id" />;
}