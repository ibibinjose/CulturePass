import { Platform } from 'react-native';
import CultureLiveEventTracker, { type CultureLiveEventTrackerProps } from '@/widgets/CultureLiveEventTracker';

let activeEventTracker: Awaited<ReturnType<typeof CultureLiveEventTracker.start>> | null = null;

export async function startEventReminderActivity(
  payload: CultureLiveEventTrackerProps,
  deepLinkUrl?: string
): Promise<void> {
  if (Platform.OS !== 'ios') return;
  activeEventTracker = await Promise.resolve(
    CultureLiveEventTracker.start(payload, deepLinkUrl)
  );
}

export async function updateEventReminderActivity(payload: CultureLiveEventTrackerProps): Promise<void> {
  if (Platform.OS !== 'ios' || !activeEventTracker) return;
  await activeEventTracker.update(payload);
}

export async function endEventReminderActivity(): Promise<void> {
  if (Platform.OS !== 'ios' || !activeEventTracker) return;
  await activeEventTracker.end('default');
  activeEventTracker = null;
}
