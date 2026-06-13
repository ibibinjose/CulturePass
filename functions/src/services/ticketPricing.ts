import type { FirestoreEvent } from './events';
import { usesExternalTicketing } from '../lib/externalTicketing';
import { db, isFirestoreConfigured } from '../admin';

export type TicketOrderInput = {
  quantity?: number;
  tierName?: string;
};

export type TicketOrderPricing = {
  quantity: number;
  tierName: string;
  unitPriceCents: number;
  totalPriceCents: number;
  discountCents?: number;
  promoCode?: string;
};

export class TicketPricingError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_QUANTITY' | 'INVALID_TIER' | 'ORDER_LIMIT_EXCEEDED',
  ) {
    super(message);
  }
}

export class PromoCodeError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_PROMO_CODE' | 'PROMO_NOT_APPLICABLE',
  ) {
    super(message);
  }
}

function normalizeTierName(value: string | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

function isFreeEvent(event: FirestoreEvent): boolean {
  return event.isFree === true || event.entryType === 'free_open';
}

export function resolveTicketOrderPricing(
  event: FirestoreEvent,
  input: TicketOrderInput,
): TicketOrderPricing {
  if (usesExternalTicketing(event)) {
    throw new TicketPricingError('Tickets are sold on the event website', 'INVALID_TIER');
  }
  const quantity = Number(input.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new TicketPricingError('Ticket quantity must be a positive integer', 'INVALID_QUANTITY');
  }

  const maxTicketsPerOrder = Number(event.maxTicketsPerOrder ?? 0);
  if (maxTicketsPerOrder > 0 && quantity > maxTicketsPerOrder) {
    throw new TicketPricingError(`Ticket quantity cannot exceed ${maxTicketsPerOrder}`, 'ORDER_LIMIT_EXCEEDED');
  }

  if (isFreeEvent(event)) {
    return {
      quantity,
      tierName: String(input.tierName ?? 'General'),
      unitPriceCents: 0,
      totalPriceCents: 0,
    };
  }

  const requestedTier = normalizeTierName(input.tierName);
  const tiers = Array.isArray(event.tiers) ? event.tiers : [];
  if (tiers.length > 0) {
    const tier = requestedTier
      ? tiers.find((candidate) => normalizeTierName(candidate.name) === requestedTier)
      : tiers[0];
    if (!tier) {
      throw new TicketPricingError('Ticket tier is not available for this event', 'INVALID_TIER');
    }
    const unitPriceCents = Math.max(0, Number(tier.priceCents ?? 0));
    return {
      quantity,
      tierName: tier.name,
      unitPriceCents,
      totalPriceCents: unitPriceCents * quantity,
    };
  }

  const unitPriceCents = Math.max(0, Number(event.priceCents ?? 0));
  return {
    quantity,
    tierName: String(input.tierName ?? 'General'),
    unitPriceCents,
    totalPriceCents: unitPriceCents * quantity,
  };
}

/** Direct issuance when nothing is owed: truly free events, or paid events after a validated promo (server-resolved). */
export function canIssueDirectTicket(event: FirestoreEvent, pricing: TicketOrderPricing): boolean {
  if (usesExternalTicketing(event)) return false;
  if (pricing.totalPriceCents !== 0) return false;
  if (isFreeEvent(event)) return true;
  return typeof pricing.promoCode === 'string' && pricing.promoCode.length > 0;
}

export async function resolveTicketOrderPricingWithPromo(
  event: FirestoreEvent,
  input: TicketOrderInput & { promoCode?: string },
): Promise<TicketOrderPricing> {
  const base = resolveTicketOrderPricing(event, input);
  const rawCode = String(input.promoCode ?? '').trim().toUpperCase();
  if (!rawCode) return base;

  if (!isFirestoreConfigured) {
    throw new PromoCodeError('Promo codes are unavailable right now', 'PROMO_NOT_APPLICABLE');
  }

  const snap = await db.collection('promoCodes').doc(rawCode).get();
  if (!snap.exists) {
    throw new PromoCodeError('Promo code not found', 'INVALID_PROMO_CODE');
  }

  const promo = snap.data() as {
    active?: boolean;
    isActive?: boolean;
    eventId?: string;
    discountType?: 'fixed' | 'percent';
    discountValue?: number;
    maxRedemptions?: number;
    redeemedCount?: number;
  };

  const isActive = promo.active !== false && promo.isActive !== false;
  if (!isActive) {
    throw new PromoCodeError('Promo code is inactive', 'PROMO_NOT_APPLICABLE');
  }
  if (promo.eventId && promo.eventId !== event.id) {
    throw new PromoCodeError('Promo code is not valid for this event', 'PROMO_NOT_APPLICABLE');
  }
  if (
    typeof promo.maxRedemptions === 'number' &&
    promo.maxRedemptions > 0 &&
    Number(promo.redeemedCount ?? 0) >= promo.maxRedemptions
  ) {
    throw new PromoCodeError('Promo code has reached redemption limit', 'PROMO_NOT_APPLICABLE');
  }

  const value = Math.max(0, Number(promo.discountValue ?? 0));
  const discountCents =
    promo.discountType === 'percent'
      ? Math.min(base.totalPriceCents, Math.round((base.totalPriceCents * value) / 100))
      : Math.min(base.totalPriceCents, Math.round(value));
  if (discountCents <= 0) return base;

  return {
    ...base,
    discountCents,
    promoCode: rawCode,
    totalPriceCents: Math.max(0, base.totalPriceCents - discountCents),
  };
}
