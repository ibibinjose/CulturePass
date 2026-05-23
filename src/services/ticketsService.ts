import { modulesApi } from '@/modules/api';

export function fetchUserTickets(userId: string) {
  return modulesApi.tickets.forUser(userId);
}

export function cancelUserTicket(ticketId: string) {
  return modulesApi.tickets.cancel(ticketId);
}
