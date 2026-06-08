import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HostItemAction } from './HostItemActionSheet';
import type { Profile, EventData, ShopListing } from '@/shared/schema';
import { navigateToEditEvent, navigateToEditShopListing } from '@/lib/creationRouting';
import { api } from '@/lib/api';
import { siteUrl, canonicalEventPath, canonicalProfilePath } from '@/lib/publicPaths';

type SharePayload = { title: string; url: string };

function confirmDestructive(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

/**
 * Hook that returns standard actions for host-created items.
 * Edit / Share / Analytics / Team / Delete — wired to real APIs.
 */
export function useHostItemActions(options?: { onShare?: (payload: SharePayload) => void }) {
  const queryClient = useQueryClient();

  const invalidateHostspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hostspace'] }),
      queryClient.invalidateQueries({ queryKey: ['hostspace-my-profiles'] }),
      queryClient.invalidateQueries({ queryKey: ['culture-market-my-listings'] }),
    ]);
  };

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => api.profiles.remove(id),
    onSuccess: invalidateHostspace,
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api.events.remove(id),
    onSuccess: invalidateHostspace,
  });

  const deleteListingMutation = useMutation({
    mutationFn: (id: string) => api.cultureShop.deleteListing(id),
    onSuccess: invalidateHostspace,
  });

  const openShare = (title: string, path: string) => {
    const url = siteUrl(path);
    options?.onShare?.({ title, url });
  };

  const getProfileActions = (profile: Profile): HostItemAction[] => [
    {
      key: 'view',
      label: 'View Profile',
      icon: 'eye-outline',
      onPress: () => router.push(`/profile/${profile.id}` as never),
    },
    {
      key: 'edit',
      label: 'Edit Profile',
      icon: 'create-outline',
      onPress: () => router.push(`/profile/edit?id=${profile.id}` as never),
    },
    {
      key: 'share',
      label: 'Share Profile',
      icon: 'share-outline',
      onPress: () => {
        const path = canonicalProfilePath(profile) ?? `/profile/${profile.handle || profile.id}`;
        openShare(profile.name, path);
      },
    },
    {
      key: 'analytics',
      label: 'View Insights',
      icon: 'analytics-outline',
      onPress: () => router.push(`/hostspace/dashboard?profileId=${profile.id}` as never),
    },
    {
      key: 'team',
      label: 'Manage Team',
      icon: 'people-outline',
      onPress: () => router.push(`/hostspace?profileId=${profile.id}&openTeam=true` as never),
    },
    {
      key: 'delete',
      label: 'Delete Profile',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        confirmDestructive('Delete profile', `Delete "${profile.name}"? This cannot be undone.`, () => {
          void deleteProfileMutation.mutateAsync(profile.id);
        });
      },
    },
  ];

  const getEventActions = (event: EventData): HostItemAction[] => [
    {
      key: 'view',
      label: 'View Event',
      icon: 'eye-outline',
      onPress: () => router.push(`/event/${event.id}` as never),
    },
    {
      key: 'edit',
      label: 'Edit Event',
      icon: 'create-outline',
      onPress: () => {
        navigateToEditEvent(event.id, 'hostspace_event_actions', event.publisherProfileId);
      },
    },
    {
      key: 'share',
      label: 'Share Event',
      icon: 'share-outline',
      onPress: () => openShare(event.title || 'Event', canonicalEventPath(event)),
    },
    {
      key: 'analytics',
      label: 'Event Analytics',
      icon: 'bar-chart-outline',
      onPress: () => router.push(`/dashboard/event-analytics/${event.id}` as never),
    },
    {
      key: 'delete',
      label: 'Cancel / Delete Event',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        confirmDestructive(
          'Delete event',
          `Delete "${event.title || 'this event'}"? Ticket holders may be affected.`,
          () => void deleteEventMutation.mutateAsync(event.id),
        );
      },
    },
  ];

  const getListingActions = (listing: ShopListing): HostItemAction[] => [
    {
      key: 'view',
      label: 'View Listing',
      icon: 'eye-outline',
      onPress: () => router.push(`/CultureMarket/${listing.id}` as never),
    },
    {
      key: 'edit',
      label: 'Edit Listing',
      icon: 'create-outline',
      onPress: () => navigateToEditShopListing(listing.id, 'hostspace_listing_actions'),
    },
    {
      key: 'share',
      label: 'Share Listing',
      icon: 'share-outline',
      onPress: () => openShare(listing.title, `/CultureMarket/${listing.id}`),
    },
    {
      key: 'analytics',
      label: 'Listing Performance',
      icon: 'bar-chart-outline',
      onPress: () => router.push('/hostspace/dashboard' as never),
    },
    {
      key: 'delete',
      label: 'Delete Listing',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        confirmDestructive('Remove listing', `Remove "${listing.title}"?`, () => {
          void deleteListingMutation.mutateAsync(listing.id);
        });
      },
    },
  ];

  return {
    getProfileActions,
    getEventActions,
    getListingActions,
  };
}