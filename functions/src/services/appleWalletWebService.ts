import { db, isFirestoreConfigured } from '../admin';

type AppleWalletRegistration = {
  id: string;
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
  pushToken: string;
  updatedAt: string;
};

const registrations = new Map<string, AppleWalletRegistration>();

function registrationId(deviceLibraryIdentifier: string, passTypeIdentifier: string, serialNumber: string): string {
  return `${deviceLibraryIdentifier}::${passTypeIdentifier}::${serialNumber}`;
}

function collection() {
  return db.collection('appleWalletRegistrations');
}

export async function registerDeviceForPass(params: {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
  pushToken: string;
}): Promise<AppleWalletRegistration> {
  const entry: AppleWalletRegistration = {
    id: registrationId(params.deviceLibraryIdentifier, params.passTypeIdentifier, params.serialNumber),
    deviceLibraryIdentifier: params.deviceLibraryIdentifier,
    passTypeIdentifier: params.passTypeIdentifier,
    serialNumber: params.serialNumber,
    pushToken: params.pushToken,
    updatedAt: new Date().toISOString(),
  };

  if (isFirestoreConfigured) {
    await collection().doc(entry.id).set(entry, { merge: true });
  } else {
    registrations.set(entry.id, entry);
  }

  return entry;
}

export async function unregisterDeviceForPass(params: {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
}): Promise<void> {
  const id = registrationId(params.deviceLibraryIdentifier, params.passTypeIdentifier, params.serialNumber);
  if (isFirestoreConfigured) {
    await collection().doc(id).delete();
  } else {
    registrations.delete(id);
  }
}

export async function listSerialNumbersForDevice(params: {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  passesUpdatedSince?: string | null;
}): Promise<{ serialNumbers: string[]; lastUpdated?: string }> {
  const updatedSinceMs = params.passesUpdatedSince ? Date.parse(params.passesUpdatedSince) : Number.NaN;
  const updatedSince = Number.isFinite(updatedSinceMs) ? updatedSinceMs : null;

  let entries: AppleWalletRegistration[] = [];
  if (isFirestoreConfigured) {
    const snap = await collection()
      .where('deviceLibraryIdentifier', '==', params.deviceLibraryIdentifier)
      .where('passTypeIdentifier', '==', params.passTypeIdentifier)
      .get();
    entries = snap.docs.map((doc) => doc.data() as AppleWalletRegistration);
  } else {
    entries = [...registrations.values()].filter((entry) =>
      entry.deviceLibraryIdentifier === params.deviceLibraryIdentifier &&
      entry.passTypeIdentifier === params.passTypeIdentifier);
  }

  const filtered = updatedSince == null
    ? entries
    : entries.filter((entry) => Date.parse(entry.updatedAt) >= updatedSince);

  const serialNumbers = [...new Set(filtered.map((entry) => entry.serialNumber))];
  const latestUpdatedMs = filtered.reduce((max, entry) => {
    const value = Date.parse(entry.updatedAt);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);

  return {
    serialNumbers,
    lastUpdated: latestUpdatedMs > 0 ? new Date(latestUpdatedMs).toISOString() : undefined,
  };
}
