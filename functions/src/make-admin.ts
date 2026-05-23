import * as admin from 'firebase-admin';

// Initialize with default credentials
admin.initializeApp({
    projectId: 'culturepass-4f264'
});

async function elevateAllUsers() {
    try {
        const db = admin.firestore();
        const usersSnap = await db.collection('users').get();
        if (usersSnap.empty) {
            console.log('No users found in the database.');
            process.exit(0);
        }

        console.log(`Found ${usersSnap.size} users. Elevating...`);
        let count = 0;

        for (const doc of usersSnap.docs) {
            const data = doc.data();
            if (data.role !== 'platformAdmin') {
                await doc.ref.update({ role: 'platformAdmin' });
                await admin.auth().setCustomUserClaims(doc.id, {
                    role: 'platformAdmin',
                    tier: data.membership?.tier || 'free',
                    city: data.city || 'Sydney',
                    country: data.country || 'Australia',
                    username: data.username || doc.id
                });
                console.log(`User ${doc.id} (${data.email || 'No Email'}) -> platformAdmin`);
                count++;
            }
        }
        
        console.log(`Successfully elevated ${count} users to platformAdmin.`);
        process.exit(0);
    } catch (e) {
        console.error('Failed to elevate users:', e);
        process.exit(1);
    }
}

elevateAllUsers();
