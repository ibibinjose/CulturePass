import { Redirect } from 'expo-router';

/** Legacy /logo — brand assets are not a standalone surface */
export default function LogoRedirect() {
  return <Redirect href="/(tabs)/menu" />;
}