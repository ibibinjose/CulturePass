export const APP_ADMIN_EMAIL = 'jiobaba369@gmail.com';

export function isAppAdminEmail(email?: string | null): boolean {
  if (typeof email !== 'string') return false;
  return email.trim().toLowerCase() === APP_ADMIN_EMAIL;
}
