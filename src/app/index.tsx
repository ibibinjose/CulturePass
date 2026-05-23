import { Redirect } from 'expo-router';
import { isCultureKeralaHost } from '@/lib/domainHost';

// Root entry point — Kerala domain lands on its dedicated hub page.
export default function Index() {
  const isKeralaDomain = isCultureKeralaHost();
  return <Redirect href={isKeralaDomain ? '/kerala' : '/(tabs)'} />;
}
