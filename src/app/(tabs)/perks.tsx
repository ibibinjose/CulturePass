import { Redirect } from 'expo-router';

/** Legacy tab route — perks live at /perks (Profile + Discover entry points). */
export default function PerksTabRedirect() {
  return <Redirect href="/perks" />;
}