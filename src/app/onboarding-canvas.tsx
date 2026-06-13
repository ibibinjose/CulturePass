import { Redirect } from 'expo-router';

/** Legacy dev canvas — signup flow lives under /(onboarding) */
export default function OnboardingCanvasRedirect() {
  return <Redirect href="/(onboarding)/signup" />;
}