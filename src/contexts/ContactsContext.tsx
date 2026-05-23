import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { contactsRepository, dedupeContactsByCpid, type SavedContact } from '@/repositories/ContactsRepository';
import { api } from '@/lib/api';

export type { SavedContact };

export interface PhoneContact {
  /** expo-contacts id */
  id: string;
  name: string;
  phoneNumbers?: string[];
  emails?: string[];
  /** matched CulturePass user — populated after server lookup */
  matched?: {
    cpid: string;
    userId: string;
    username?: string;
    avatarUrl?: string;
    tier?: string;
    city?: string;
  } | null;
  invited?: boolean;
}

interface ContactsContextValue {
  contacts: SavedContact[];
  addContact: (contact: Omit<SavedContact, 'savedAt'>) => void;
  removeContact: (cpid: string) => void;
  isContactSaved: (cpid: string) => boolean;
  getContact: (cpid: string) => SavedContact | undefined;
  updateContact: (cpid: string, updates: Partial<SavedContact>) => void;
  clearContacts: () => void;
  /** Phone-synced contacts (raw from device) */
  phoneContacts: PhoneContact[];
  setPhoneContacts: (contacts: PhoneContact[]) => void;
  markInvited: (phoneContactId: string) => void;
  /** cpids of users already imported from phone */
  importedFromPhone: Set<string>;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [phoneContacts, setPhoneContactsState] = useState<PhoneContact[]>([]);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      contactsRepository.getAllContacts(),
      contactsRepository.getInvitedIds(),
    ]).then(([stored, storedInvited]) => {
      if (stored && stored.length > 0) {
        const deduped = dedupeContactsByCpid(stored);
        setContacts(deduped);
        if (deduped.length !== stored.length) {
          contactsRepository.saveAllContacts(deduped).catch(() => {});
        }
      }
      setInvitedIds(storedInvited);
    });
  }, []);

  const persist = useCallback((updated: SavedContact[]) => {
    contactsRepository.saveAllContacts(updated).catch(() => {});
  }, []);

  const addContact = useCallback((contact: Omit<SavedContact, 'savedAt'>) => {
    setContacts(prev => {
      const exists = prev.find(c => c.cpid === contact.cpid);
      if (exists) {
        const updated = prev.map(c =>
          c.cpid === contact.cpid ? { ...c, ...contact, savedAt: c.savedAt } : c
        );
        persist(updated);
        const next = updated.find(c => c.cpid === contact.cpid);
        const newUserId = next?.userId;
        if (newUserId && newUserId !== exists.userId) {
          void api.social.contactSave(newUserId).catch(() => {});
        }
        return updated;
      }
      const newContact: SavedContact = { ...contact, savedAt: new Date().toISOString() };
      const updated = [newContact, ...prev];
      persist(updated);
      if (newContact.userId) {
        void api.social.contactSave(newContact.userId).catch(() => {});
      }
      return updated;
    });
  }, [persist]);

  const removeContact = useCallback((cpid: string) => {
    setContacts(prev => {
      const updated = prev.filter(c => c.cpid !== cpid);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const isContactSaved = useCallback((cpid: string) => contacts.some(c => c.cpid === cpid), [contacts]);

  const getContact = useCallback((cpid: string) => contacts.find(c => c.cpid === cpid), [contacts]);

  const updateContact = useCallback((cpid: string, updates: Partial<SavedContact>) => {
    setContacts(prev => {
      const updated = prev.map(c => c.cpid === cpid ? { ...c, ...updates } : c);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearContacts = useCallback(() => {
    setContacts([]);
    contactsRepository.clearAllContacts().catch(() => {});
  }, []);

  const setPhoneContacts = useCallback((updated: PhoneContact[]) => {
    // Map the invited state from the persisted invitedIds Set so re-syncing retains checkmarks
    setPhoneContactsState(updated.map(c => ({
      ...c,
      invited: c.invited || invitedIds.has(c.id)
    })));
  }, [invitedIds]);

  const markInvited = useCallback(async (phoneContactId: string) => {
    setPhoneContactsState(prev => prev.map(c =>
      c.id === phoneContactId ? { ...c, invited: true } : c
    ));
    setInvitedIds(prev => {
      const next = new Set(prev);
      next.add(phoneContactId);
      return next;
    });
    // Fire and forget storage
    contactsRepository.addInvitedId(phoneContactId).catch(() => {});
  }, []);

  const importedFromPhone = useMemo<Set<string>>(
    () => new Set(contacts.filter(c => c.fromPhone).map(c => c.cpid)),
    [contacts]
  );

  const value = useMemo(() => ({
    contacts,
    addContact,
    removeContact,
    isContactSaved,
    getContact,
    updateContact,
    clearContacts,
    phoneContacts,
    setPhoneContacts,
    markInvited,
    importedFromPhone,
  }), [
    contacts, addContact, removeContact, isContactSaved, getContact,
    updateContact, clearContacts, phoneContacts, setPhoneContacts,
    markInvited, importedFromPhone,
  ]);

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) throw new Error('useContacts must be used within ContactsProvider');
  return context;
}
