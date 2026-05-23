import type { SavedContact } from '@/repositories/ContactsRepository';

/** Readable label for a saved contact (never generic unless truly unknown). */
export function contactDisplayName(
  contact: Pick<SavedContact, 'name' | 'username' | 'cpid'>,
): string {
  const name = contact.name?.trim();
  if (name && name.toUpperCase() !== contact.cpid.toUpperCase()) return name;
  const handle = contact.username?.trim().replace(/^@/, '');
  if (handle) return `@${handle}`;
  return contact.cpid;
}
