import { Redirect } from 'expo-router';

/** Legacy `/(tabs)/profile` deep links → MySpace. */
export default function ProfileTabRedirect() {
  return <Redirect href="/(tabs)/my-space" />;
}
