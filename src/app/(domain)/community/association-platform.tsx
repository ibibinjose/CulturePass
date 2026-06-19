import { Redirect } from 'expo-router';

/** Legacy association platform stub — community hub is /community */
export default function AssociationPlatformRedirect() {
  return <Redirect href="/(tabs)/community" />;
}