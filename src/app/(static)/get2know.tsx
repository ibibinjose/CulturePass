import { Redirect } from 'expo-router';

/** Legacy URL — all “get to know” content lives on `/about`. */
export default function Get2KnowRedirect() {
  return <Redirect href="/about" />;
}
