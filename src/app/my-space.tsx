import { Redirect } from 'expo-router';

/** Legacy `/my-space` deep links → canonical MySpace tab. */
export default function MySpaceLegacyRedirect() {
  return <Redirect href="/(tabs)/myspace" />;
}