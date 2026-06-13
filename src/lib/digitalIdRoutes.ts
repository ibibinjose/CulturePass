/** User-facing Digital ID — polished member experience */
export const DIGITAL_ID_ROUTE = '/profile/digital-id' as const;

/** Developer / admin pass lab — exports, themes, affiliations, event passes */
export const DIGITAL_ID_DEV_ROUTE = '/profile/qr' as const;

export function canAccessDigitalIdDevTools(isAdmin: boolean): boolean {
  return __DEV__ || isAdmin;
}