import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

export interface ExportContactData {
  displayName: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  cpid?: string;
  membershipTier?: string;
}

/**
 * Downloads a contact as a vCard (RFC 6350) file on Web.
 */
function downloadVCardWeb(data: ExportContactData) {
  const nameParts = (data.displayName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const notes = [
    data.cpid ? `CulturePass ID: ${data.cpid}` : '',
    data.membershipTier ? `Membership: ${data.membershipTier.toUpperCase()}` : '',
    data.bio ? `Bio: ${data.bio}` : '',
  ]
    .filter(Boolean)
    .join('\\n'); // vCard literal escaped newline

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.displayName}`,
    `N:${lastName};${firstName};;;`,
    data.email ? `EMAIL;TYPE=INTERNET;TYPE=WORK:${data.email}` : '',
    data.phone ? `TEL;TYPE=CELL:${data.phone}` : '',
    data.website ? `URL:${data.website}` : '',
    data.city || data.state || data.country
      ? `ADR;TYPE=WORK:;;;${data.city || ''};${data.state || ''};;${data.country || ''}`
      : '',
    notes ? `NOTE:${notes}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const filename = `${data.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_contact.vcf`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports a contact to the device's native address book (iOS/Android) or downloads a vCard (Web).
 */
export async function exportToAddressBook(data: ExportContactData): Promise<{ success: boolean; message: string }> {
  if (Platform.OS === 'web') {
    try {
      downloadVCardWeb(data);
      return { success: true, message: 'vCard download started.' };
    } catch (err) {
      console.error('vCard download failed:', err);
      return { success: false, message: 'vCard download failed.' };
    }
  }

  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== Contacts.PermissionStatus.GRANTED) {
      return { success: false, message: 'Permission to access contacts was denied.' };
    }

    const nameParts = (data.displayName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Notes field in native address book
    const notes = [
      data.cpid ? `CulturePass ID: ${data.cpid}` : '',
      data.membershipTier ? `Membership: ${data.membershipTier.toUpperCase()}` : '',
      data.bio ? `Bio: ${data.bio}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const contact: Contacts.ContactFormParameters = {
      [Contacts.Fields.FirstName]: firstName,
      [Contacts.Fields.LastName]: lastName,
      [Contacts.Fields.Note]: notes,
    };

    if (data.email) {
      contact[Contacts.Fields.Emails] = [
        {
          label: 'work',
          email: data.email,
          id: 'cp_email',
        },
      ];
    }

    if (data.phone) {
      contact[Contacts.Fields.PhoneNumbers] = [
        {
          label: 'mobile',
          number: data.phone,
          id: 'cp_phone',
        },
      ];
    }

    if (data.website) {
      contact[Contacts.Fields.UrlAddresses] = [
        {
          label: 'work',
          url: data.website,
          id: 'cp_web',
        },
      ];
    }

    // Try presenting the OS contact editor sheet first (preferred UX)
    try {
      await Contacts.presentFormAsync(undefined, contact, {
        isNew: true,
      });
      return { success: true, message: 'Contact editor opened.' };
    } catch (formError) {
      // Fallback: direct insert if OS editor form fails
      console.warn('Contacts.presentFormAsync failed, falling back to direct add:', formError);
      await Contacts.addContactAsync({
        ...contact,
        contactType: Contacts.ContactType.Person,
      } as any);
      return { success: true, message: 'Contact saved directly to address book.' };
    }
  } catch (err: any) {
    console.error('Failed to export contact:', err);
    return { success: false, message: err.message || 'Failed to save contact.' };
  }
}
