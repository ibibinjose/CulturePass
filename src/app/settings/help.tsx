import { Redirect } from 'expo-router';

/** Legacy /settings/help — canonical help centre is /help */
export default function SettingsHelpRedirect() {
  return <Redirect href="/help" />;
}