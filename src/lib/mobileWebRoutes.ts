/** Tab routes that render their own top chrome — skip the global mobile-web burger header. */
const MOBILE_WEB_TAB_PATHS = new Set([
  '/',
  '/calendar',
  '/community',
  '/city',
  '/my-space',
  '/perks',
  '/menu',
  '/directory',
]);

export function shouldHideMobileWebGlobalHeader(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return MOBILE_WEB_TAB_PATHS.has(pathname);
}