import { Redirect } from 'expo-router';

export default function DebugIndex() {
  return <Redirect href="/debug/deep-links" />;
}