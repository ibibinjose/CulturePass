import { Redirect } from 'expo-router';

/**
 * Host tab — Entry point to HostSpace v2.
 * Redirects to the canonical /hostspace hub.
 */
export default function HostTabRedirect() {
  return <Redirect href="/hostspace" />;
}
