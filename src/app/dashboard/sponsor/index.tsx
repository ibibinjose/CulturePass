import { Redirect } from 'expo-router';

/** Sponsor hub — consolidated into HostSpace dashboard until a dedicated surface ships. */
export default function SponsorDashboardRedirect() {
  return <Redirect href="/hostspace/dashboard" />;
}