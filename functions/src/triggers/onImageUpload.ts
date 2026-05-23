import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Triggered automatically when ANY file is uploaded to Firebase Storage.
 * It checks if the file is an image, generates a ThumbHash locally 
 * (to keep it fast and secure), and automatically updates the corresponding 
 * Firestore document.
 */
export const onImageUploadGenerateThumbhash = functions
  .runWith({ memory: '1GB', timeoutSeconds: 120 }) // Sharp needs a higher heap allocation
  .storage.object().onFinalize(async (object) => {
    try {
      // 1. Validate payload
      if (!object.name || !object.contentType?.startsWith('image/')) {
        return null;
      }
      
      const filePath = object.name;
      // Expecting standard CulturePass uploads: {collection}/{docId}/{fileName}
      const pathParts = filePath.split('/');
      if (pathParts.length < 3) {
        console.log(`[ThumbHash] Ignoring non-standard upload path: ${filePath}`);
        return null;
      }
      
      const collectionName = pathParts[0];
      const docId = pathParts[1];

      // Prevent processing avatars/covers that were just created to loop? 
      // Storage triggers only fire on new Object uploads anyway.

      // 2. Download into temporary environment
      const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
      const bucket = admin.storage().bucket(object.bucket);
      await bucket.file(filePath).download({ destination: tempFilePath });

      // 3. Process via Sharp for ThumbHash extraction
      const { data, info } = await sharp(tempFilePath)
        .resize(100, 100, { fit: 'inside' }) // Downscale heavily for faster hashing
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const thumbhashBytes = rgbaToThumbHash(info.width, info.height, data);
      const thumbhashStr = Buffer.from(thumbhashBytes).toString('base64');

      // 4. Teardown
      fs.unlinkSync(tempFilePath);

      // 5. Retroactively update the Firestore document if available
      // It locates it via the collection name array.
      if (docId !== 'temp') {
        const docRef = admin.firestore().collection(collectionName).doc(docId);
        
        // We do not know exactly which field (avatarUrl, coverUrl) was attached. 
        // We append thumbhash at the root, which CultureImage naturally resolves!
        await docRef.set({ thumbhash: thumbhashStr, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        console.log(`[ThumbHash] Generated and attached to ${collectionName}/${docId}`);
      } else {
        console.log(`[ThumbHash] Ignored temp doc update but generated efficiently.`);
      }

      return null;
      
    } catch (error) {
      console.error('[ThumbHash] Critical Error processing image:', error);
      return null;
    }
});
