/** Canonical tickets list — maps to src/app/tickets/index.tsx */
export const TICKETS_LIST_PATH = '/tickets' as const;

/** Expo Router static segments that must not be treated as ticket IDs in tickets/[id].tsx */
const RESERVED_TICKET_ROUTE_IDS = new Set(['index', 'print']);

export function isReservedTicketRouteId(id: string | undefined | null): boolean {
  if (!id) return true;
  return RESERVED_TICKET_ROUTE_IDS.has(String(id).trim().toLowerCase());
}