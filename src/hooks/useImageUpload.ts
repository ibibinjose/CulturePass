import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { arrayUnion, doc, updateDoc, deleteField } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { formatStorageUploadError, storageRefFromDownloadUrl, uriToBlob } from '../lib/storageUtils';

export interface UploadResult {
  downloadURL: string;
  thumbhash?: string; // Automatically populated via Cloud Functions post-upload
}

export type ImageUploadOptions = {
  resizeWidth?: number;
  preservePrevious?: boolean;
  previousUrl?: string | null;
  historyFieldName?: string;
};

/**
 * 🚀 CulturePass Optimized Image Upload Hook
 * - Implements Client-Side compression (Fast & Cost Save)
 * - Firebase Storage upload stream parsing for progress UI
 * - Automatic atomic CRUD matching exactly to Firestore docs
 * - Cache-busting URL architecture via timestamps
 */
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Automatically compresses the selected image, uploads it securely into Firebase Storage,
   * inside the specific {collection}/{docId} directory, and immediately writes the returned
   * URL back to the Firestore document field.
   */
  const uploadImage = async (
    pickerResult: ImagePicker.ImagePickerResult,
    collectionName: string,
    docId: string,
    fieldName: string = 'coverUrl',
    skipDbUpdate: boolean = false,
    options: ImageUploadOptions = {},
  ): Promise<UploadResult> => {
    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      throw new Error('No image provided');
    }

    setUploading(true);
    setProgress(0);

    if (!storage || !db) {
      setUploading(false);
      throw new Error('Image upload is unavailable: Firebase is not configured for this build.');
    }

    try {
      const asset = pickerResult.assets[0];
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        throw new Error('Image is too large (max 10 MB). Choose a smaller photo.');
      }

      // 1. Client-Side Image Compression (Save Bandwidth & Storage)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: options.resizeWidth ?? 1200 } }], // Ideal max width preserving AR
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } // 80% JPEG compression
      );

      const blob = await uriToBlob(manipulated.uri);

      // 2. Upload to path hierarchy structure (e.g. users/123/1643...-abc.jpg)
      // Including Date.now() guarantees cache-busting when replacing avatars via Expo Image
      const timestamp = Date.now();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.jpg`;
      const storageRef = ref(storage, `${collectionName}/${docId}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });

      // Listen to streaming upload progress
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(currentProgress);
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(storageRef);

      if (!skipDbUpdate) {
        // 3. Atomically update Firestore with new remote URL
        const { setDoc } = await import('firebase/firestore');
        const docRef = doc(db, collectionName, docId);
        const updatePayload: Record<string, unknown> = {
          [fieldName]: downloadURL,
          updatedAt: new Date(),
        };
        const previousUrl = options.previousUrl?.trim();
        if (options.preservePrevious && previousUrl && previousUrl !== downloadURL) {
          updatePayload[options.historyFieldName ?? `${fieldName}History`] = arrayUnion({
            url: previousUrl,
            replacedAt: new Date(),
          });
        }
        await setDoc(docRef, updatePayload, { merge: true });
      }

      return { downloadURL };
    } catch (error) {
      throw new Error(formatStorageUploadError(error));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /**
   * Destroys an existing remote file accurately and cleanly removes its pointer from Firestore.
   */
  const deleteImage = async (
    collectionName: string,
    docId: string,
    oldUrl: string,
    fieldName: string = 'coverUrl'
  ) => {
    if (!oldUrl) return;
    if (!storage || !db) {
      console.warn('[CulturePass] deleteImage skipped: Firebase Storage/Firestore not configured.');
      return;
    }
    try {
      const storageRef = storageRefFromDownloadUrl(storage, oldUrl);
      await deleteObject(storageRef);

      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, { [fieldName]: deleteField(), updatedAt: new Date() });
    } catch (e) {
      console.warn('[CulturePass] Delete image failed. It might have been manually deleted or is missing.', e);
    }
  };

  return { uploadImage, deleteImage, uploading, progress };
};
