import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { isAppAdminEmail } from '@/lib/admin';

type OwnershipFields = {
  ownerId?: string | null;
  organizerId?: string | null;
  createdBy?: string | null;
  providerId?: string | null;
};

export function useCanEdit(entity?: OwnershipFields | null) {
  const { userId, user } = useAuth();
  const { isAdmin, isModerator } = useRole();

  if (!userId || !entity) return false;

  const isOwner =
    (entity.ownerId && entity.ownerId === userId) ||
    (entity.organizerId && entity.organizerId === userId) ||
    (entity.createdBy && entity.createdBy === userId) ||
    (entity.providerId && entity.providerId === userId);

  const isAppAdmin = isAppAdminEmail(user?.email);
  return !!(isOwner || isAdmin || isModerator || isAppAdmin);
}

export function useIsCreator() {
  const { isAuthenticated } = useAuth();
  const { isOrganizer } = useRole();
  return isAuthenticated && isOrganizer;
}
