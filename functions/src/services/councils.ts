/**
 * Councils (LGA) Firestore service — dev seed when collection is empty.
 */

import { db } from '../admin';

const nowIso = () => new Date().toISOString();

/** Minimal AU councils for local emulator / empty Firestore (includes coordinates). */
const DEV_COUNCILS = [
  {
    id: 'co-au-17200',
    name: 'City of Sydney',
    state: 'NSW',
    lgaCode: '17200',
    suburb: 'Sydney',
    postcode: 2000,
    latitude: -33.8688,
    longitude: 151.2093,
    country: 'Australia',
    serviceCities: ['Sydney', 'Barangaroo', 'Darling Harbour'],
    serviceSuburbs: ['Sydney', 'Barangaroo'],
    servicePostcodes: [2000, 2010, 2015],
    verificationStatus: 'unverified',
    status: 'active',
  },
  {
    id: 'co-au-14900',
    name: 'Liverpool City Council',
    state: 'NSW',
    lgaCode: '14900',
    suburb: 'Liverpool',
    postcode: 2170,
    latitude: -33.9194,
    longitude: 150.9257,
    country: 'Australia',
    serviceCities: ['Liverpool'],
    serviceSuburbs: ['Liverpool'],
    servicePostcodes: [2170],
    verificationStatus: 'unverified',
    status: 'active',
  },
  {
    id: 'co-au-10750',
    name: 'Blacktown City Council',
    state: 'NSW',
    lgaCode: '10750',
    suburb: 'Blacktown',
    postcode: 2148,
    latitude: -33.771,
    longitude: 150.906,
    country: 'Australia',
    serviceCities: ['Blacktown'],
    serviceSuburbs: ['Blacktown'],
    servicePostcodes: [2148],
    verificationStatus: 'unverified',
    status: 'active',
  },
  {
    id: 'co-au-11500',
    name: 'Campbelltown City Council',
    state: 'NSW',
    lgaCode: '11500',
    suburb: 'Campbelltown',
    postcode: 2560,
    latitude: -34.065,
    longitude: 150.814,
    country: 'Australia',
    serviceCities: ['Campbelltown'],
    serviceSuburbs: ['Campbelltown'],
    servicePostcodes: [2560],
    verificationStatus: 'unverified',
    status: 'active',
  },
  {
    id: 'co-au-14650',
    name: 'Lake Macquarie City Council',
    state: 'NSW',
    lgaCode: '14650',
    suburb: 'Speers Point',
    postcode: 2284,
    latitude: -32.95,
    longitude: 151.6,
    country: 'Australia',
    serviceCities: ['Lake Macquarie', 'Newcastle'],
    serviceSuburbs: ['Speers Point'],
    servicePostcodes: [2284],
    verificationStatus: 'unverified',
    status: 'active',
  },
  {
    id: 'co-au-20570',
    name: 'City of Melbourne',
    state: 'VIC',
    lgaCode: '20570',
    suburb: 'Melbourne',
    postcode: 3000,
    latitude: -37.8136,
    longitude: 144.9631,
    country: 'Australia',
    serviceCities: ['Melbourne'],
    serviceSuburbs: ['Melbourne'],
    servicePostcodes: [3000],
    verificationStatus: 'unverified',
    status: 'active',
  },
  {
    id: 'co-au-31000',
    name: 'Brisbane City Council',
    state: 'QLD',
    lgaCode: '31000',
    suburb: 'Brisbane',
    postcode: 4000,
    latitude: -27.4679,
    longitude: 153.0281,
    country: 'Australia',
    serviceCities: ['Brisbane'],
    serviceSuburbs: ['Brisbane'],
    servicePostcodes: [4000],
    verificationStatus: 'unverified',
    status: 'active',
  },
] as const;

export const councilsService = {
  async seedIfEmpty(): Promise<{ seeded: boolean; count: number }> {
    const snap = await db.collection('councils').limit(1).get();
    if (!snap.empty) return { seeded: false, count: 0 };

    const ts = nowIso();
    let batch = db.batch();
    let n = 0;
    for (const council of DEV_COUNCILS) {
      const ref = db.collection('councils').doc(council.id);
      batch.set(ref, { ...council, createdAt: ts, updatedAt: ts }, { merge: true });
      n += 1;
      if (n % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    if (n % 400 !== 0) await batch.commit();

    console.log(`[councils] seeded ${n} dev councils (collection was empty)`);
    return { seeded: true, count: n };
  },
};