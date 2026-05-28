import { router } from 'expo-router';
import { HostItemAction } from './HostItemActionSheet';
import type { Profile, EventData } from '@/shared/schema';

/**
 * Hook that returns standard actions for host-created items.
 * This centralizes the logic for Edit / Share / Analytics / Team / Delete.
 */
export function useHostItemActions() {
  const getProfileActions = (profile: Profile): HostItemAction[] => [
    {
      key: 'view',
      label: 'View Profile',
      icon: 'eye-outline',
      onPress: () => {
        router.push(`/profile/${profile.id}` as never);
      },
    },
    {
      key: 'edit',
      label: 'Edit Profile',
      icon: 'create-outline',
      onPress: () => {
        router.push(`/profile/edit?id=${profile.id}` as never);
      },
    },
    {
      key: 'share',
      label: 'Share Profile',
      icon: 'share-outline',
      onPress: () => {
        // TODO: Open generalized share sheet
        // For now route to existing modal usage pattern
        router.push(`/hostspace/create?profileId=${profile.id}&action=share` as never);
      },
    },
    {
      key: 'analytics',
      label: 'View Insights',
      icon: 'analytics-outline',
      onPress: () => {
        router.push(`/hostspace/dashboard?profileId=${profile.id}` as never);
      },
    },
    {
      key: 'team',
      label: 'Manage Team',
      icon: 'people-outline',
      onPress: () => {
        router.push(`/hostspace?profileId=${profile.id}&openTeam=true` as never);
      },
    },
    {
      key: 'delete',
      label: 'Delete Profile',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        // TODO: Wire to real delete with confirmation
        console.warn('Delete profile:', profile.id);
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
        router.push(`/hostspace/create/event?eventId=${event.id}` as never);
      },
    },
    {
      key: 'share',
      label: 'Share Event',
      icon: 'share-outline',
      onPress: () => {
        // TODO: Open universal share
        console.log('Share event', event.id);
      },
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
        console.warn('Delete event:', event.id);
      },
    },
  ];

  return {
    getProfileActions,
    getEventActions,
  };
}