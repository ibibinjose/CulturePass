import { PostHog } from 'posthog-react-native';

const posthogClient = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ? new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  enableSessionReplay: true,
  sessionReplayConfig: {
    maskAllTextInputs: true,
    maskAllImages: false,
    captureLog: true,
    captureNetworkTelemetry: true,
  },
}) : null;

export const captureEvent = (eventName: string, properties?: Record<string, any>) => {
  if (posthogClient) {
    posthogClient.capture(eventName, properties);
  }
};

/** Stripe success page, free in-app checkout, or return from hosted checkout — same shape as `event_detail_viewed` profile fields. */
export function captureTicketPurchaseCompleted(payload: {
  ticket_id: string;
  event_id: string;
  publisher_profile_id?: string | null;
  venue_profile_id?: string | null;
  organizer_id?: string | null;
  quantity?: number;
  total_price_cents?: number | null;
  source: 'payment_success_screen' | 'free_ticket_in_app' | 'stripe_web_checkout_return' | 'checkout_free_ticket';
}) {
  captureEvent('ticket_purchase_completed', {
    ticket_id: payload.ticket_id,
    event_id: payload.event_id,
    publisher_profile_id: payload.publisher_profile_id ?? null,
    venue_profile_id: payload.venue_profile_id ?? null,
    organizer_id: payload.organizer_id ?? null,
    quantity: payload.quantity ?? 1,
    total_price_cents: payload.total_price_cents ?? null,
    source: payload.source,
  });
  captureEvent('funnel_stage', {
    stage: 'checkout',
    event_id: payload.event_id,
    ticket_id: payload.ticket_id,
    source: payload.source,
  });
}

export const identifyUser = (distinctId: string, properties?: Record<string, any>) => {
  if (posthogClient) {
    posthogClient.identify(distinctId, properties);
  }
};

export const resetUser = () => {
  if (posthogClient) {
    posthogClient.reset();
  }
};

export default posthogClient;
