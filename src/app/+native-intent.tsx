import { normalizeSystemPath } from '@/lib/routes';
import { deepLinkResolver } from '@/lib/deep-link-resolver';

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  // Persist the deep-link destination for post-auth navigation (Req 10.4)
  if (initial && path && path !== '/') {
    deepLinkResolver.persistDestination(path);
  }

  return normalizeSystemPath(path, initial);
}
