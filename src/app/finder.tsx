import { Redirect } from 'expo-router';

/** Legacy /finder — superseded by /search */
export default function FinderRedirect() {
  return <Redirect href="/search" />;
}