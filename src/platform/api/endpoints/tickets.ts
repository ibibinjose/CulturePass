import type { ApiRequestFn } from '../client';
import type { Ticket, WalletPassLinkResponse } from '@/shared/schema';

export function createTicketsNamespace(request: ApiRequestFn) {
  return {
    forUser: async (userId: string) => {
      const payload = await request<unknown>('GET', `api/tickets/${userId}`);
      if (Array.isArray(payload)) {
        return payload as Ticket[];
      }
      if (
        payload &&
        typeof payload === 'object' &&
        'tickets' in payload &&
        Array.isArray((payload as { tickets?: unknown }).tickets)
      ) {
        return (payload as { tickets: Ticket[] }).tickets;
      }
      if (__DEV__) {
        console.warn('[api.tickets.forUser] Unexpected payload shape:', payload);
      }
      return [];
    },

    get: (id: string) => request<Ticket>('GET', `api/ticket/${id}`),

    purchase: (data: {
      eventId: string;
      tierName?: string;
      tierId?: string;
      quantity?: number;
      promoCode?: string;
      familyMemberId?: string;
    }) => request<Ticket>('POST', 'api/tickets', data),

    cancel: (id: string) => request<{ success: boolean }>('PUT', `api/tickets/${id}/cancel`),

    scan: (data: { ticketCode: string; scannedBy?: string }) =>
      request<{ valid: boolean; message: string; outcome?: string; ticket?: Ticket }>(
        'POST',
        'api/tickets/scan',
        data,
      ),

    walletApple: (ticketId: string) =>
      request<WalletPassLinkResponse>('GET', `api/tickets/${ticketId}/wallet/apple`),

    walletGoogle: (ticketId: string) =>
      request<WalletPassLinkResponse>('GET', `api/tickets/${ticketId}/wallet/google`),

    assign: (id: string, data: { familyMemberName?: string; attendeeEmail?: string }) =>
      request<Ticket>('PUT', `api/tickets/${id}/assign`, data),

    transfer: (id: string, data: { email: string }) =>
      request<Ticket>('POST', `api/tickets/${id}/transfer`, data),
  };
}
