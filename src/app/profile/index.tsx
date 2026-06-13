import { Redirect } from 'expo-router';

/** Legacy `/profile` → canonical MySpace tab. */
export default function ProfileIndexRedirect() {
  return <Redirect href="/(tabs)/myspace" />;
}