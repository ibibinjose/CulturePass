import { captureEvent } from './analytics';

export type FunnelStage = 'view' | 'save' | 'checkout' | 'attend' | 'return';

export function captureFunnelStage(payload: {
  stage: FunnelStage;
  eventId?: string;
  userId?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  captureEvent('funnel_stage', {
    stage: payload.stage,
    event_id: payload.eventId ?? null,
    user_id: payload.userId ?? null,
    source: payload.source ?? 'app',
    ...(payload.metadata ?? {}),
  });
}

export function captureDiscoverView(userId?: string, source = 'discover_home') {
  captureFunnelStage({ stage: 'view', userId, source });
}

export function captureEventSave(eventId: string, userId?: string, source = 'event_card') {
  captureFunnelStage({ stage: 'save', eventId, userId, source });
}

export function captureCheckoutStart(eventId: string, userId?: string, source = 'event_detail') {
  captureFunnelStage({ stage: 'checkout', eventId, userId, source });
}

export function captureAttend(eventId: string | undefined, userId?: string, source = 'ticket_scan') {
  captureFunnelStage({ stage: 'attend', eventId, userId, source });
}

export function captureReturn(userId?: string, source = 'app_reopen') {
  captureFunnelStage({ stage: 'return', userId, source });
}
