import { authAdmin, db } from '../functions/src/admin';

async function createDemoUser() {
  const email = 'demo@culturepass.com.au';
  const password = 'CulturePassReview2026!'; // Strong password for app review
  const displayName = 'App Review Demo';

  try {
    let user;
    try {
      user = await authAdmin.getUserByEmail(email);
      console.log(`Demo user already exists: ${user.uid}`);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        user = await authAdmin.createUser({
          email,
          password,
          emailVerified: true,
          displayName,
        });
        console.log(`Created new demo user: ${user.uid}`);
      } else {
        throw e;
      }
    }

    // Assign appropriate claims: Organizer for the demo
    await authAdmin.setCustomUserClaims(user.uid, {
      role: 'organizer',
      tier: 'plus',
      culturePassId: 'CP-DEMO-1234'
    });
    console.log(`Set custom claims for user ${user.uid}`);

    // Create a matching profile in Firestore
    const userRef = db.collection('users').doc(user.uid);
    await userRef.set({
      uid: user.uid,
      email,
      displayName,
      role: 'organizer',
      culturePassId: 'CP-DEMO-1234',
      membership: {
        tier: 'plus',
        isActive: true,
        expiresAt: null
      },
      city: 'Sydney',
      country: 'Australia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interests: ['Festivals', 'Food', 'Music'],
      communities: [],
      isSydneyVerified: true,
    }, { merge: true });

    console.log(`Successfully configured Firestore document for demo user.`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
}

createDemoUser();
