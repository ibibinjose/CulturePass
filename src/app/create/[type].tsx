import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolveLegacyCreateRedirect } from '@/constants/navigation/createNav';

/**
 * Legacy `/create/:type` — resolves to the Creation Lab, event wizard, listing wizard, or CultureMarket lab.
 */
export default function CreateTypeRedirect() {
  const paramsObj = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const rawType = paramsObj.type;
  const type = typeof rawType === 'string' ? rawType : Array.isArray(rawType) ? rawType[0] : undefined;
  const dest = resolveLegacyCreateRedirect(type, paramsObj);
  return <Redirect href={dest as never} />;
}
