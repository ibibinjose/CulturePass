import { useAuth } from '@/lib/auth';
import { avatarDisplayUri, avatarRecyclingKey } from '@/lib/avatarUri';
import { useCallback } from 'react';

/**
 * Custom hook to manage profile images consistently across the app
 * Ensures profile images update and show everywhere when changed
 */
export function useProfileImage() {
  const { user, updateUserProfile } = useAuth();

  /**
   * Updates the profile image and ensures it propagates everywhere in the app
   * @param avatarUrl The new avatar URL to set
   */
  const updateProfileImage = useCallback(async (avatarUrl: string) => {
    if (!updateUserProfile) {
      throw new Error('updateUserProfile is not available');
    }

    // Update the profile with the new avatar URL
    await updateUserProfile({ avatarUrl });
  }, [updateUserProfile]);

  /**
   * Gets the current profile image URL
   */
  const getProfileImage = useCallback(() => {
    return user?.avatarUrl || null;
  }, [user?.avatarUrl]);

  /**
   * Gets the initials for the user if no avatar is available
   */
  const getInitials = useCallback(() => {
    if (!user?.displayName && !user?.email) return '?';
    
    const displayName = user?.displayName || user?.email?.split('@')[0] || '';
    const initials = displayName
      .trim()
      .split(' ')
      .map((word: string) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    return initials || '?';
  }, [user?.displayName, user?.email]);

  const recyclingKey = avatarRecyclingKey(user);
  const profileImage = avatarDisplayUri(user?.avatarUrl, recyclingKey);

  return {
    profileImage,
    updateProfileImage,
    getProfileImage,
    getInitials,
    initials: getInitials(),
    firstName: user?.displayName?.split(' ')[0] || user?.username || 'Profile',
    recyclingKey,
  };
}