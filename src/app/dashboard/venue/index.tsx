import { Redirect } from 'expo-router';

/** Venue hub — consolidated into HostSpace dashboard until a dedicated surface ships. */
export default function VenueDashboardRedirect() {
  return <Redirect href="/hostspace/dashboard" />;
}