import * as functions from 'firebase-functions/v1';
import { processWaitlistQueue } from '../handlers/waitlist';

/**
 * When a ticket is cancelled, check the waitlist and notify the next person in queue.
 */
export const onTicketCancelled = functions.firestore
  .document('tickets/{ticketId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      const eventId = after.eventId as string | undefined;
      if (eventId) {
        await processWaitlistQueue(eventId);
      }
    }
  });
