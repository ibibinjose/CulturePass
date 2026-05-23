/**
 * Form Analytics Service
 *
 * Tracks form wizard performance and user behavior for the HostSpace
 * Enterprise-Grade Form System. Integrates with the existing PostHog
 * analytics layer (`@/lib/analytics`) to capture:
 *
 * - Step completion rates and time per step
 * - Abandonment points (where users exit without completing)
 * - Validation error frequency by field
 * - Auto-save success/failure rates
 * - API response times
 * - Upload success/failure rates
 * - AI assist usage by field
 * - Device/browser distribution
 * - Alert thresholds (5% error rate, 2s response time)
 *
 * Requirement: 38 (Monitoring and Observability)
 */

import { Platform } from 'react-native';
import { captureEvent } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Wizard step numbers */
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

/** Entity types supported by the form wizard */
export type FormEntityType =
  | 'community'
  | 'organiser'
  | 'venue'
  | 'business'
  | 'artist'
  | 'professional';

/** Auto-save outcome */
export type AutoSaveStatus = 'success' | 'failure';

/** Upload outcome */
export type UploadStatus = 'success' | 'failure';

/** Alert severity levels */
export type AlertSeverity = 'warning' | 'critical';

/** Device platform info */
export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
}

/** Form session metadata attached to all events */
export interface FormSessionContext {
  sessionId: string;
  userId: string;
  entityType: FormEntityType;
  draftId?: string;
  profileId?: string;
  device: DeviceInfo;
}

/** Step timing entry */
export interface StepTiming {
  step: WizardStep;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
}

/** Validation error entry */
export interface ValidationErrorEntry {
  field: string;
  step: WizardStep;
  errorType: string;
  message?: string;
}

/** API call timing entry */
export interface ApiTimingEntry {
  endpoint: string;
  method: string;
  durationMs: number;
  statusCode: number;
  success: boolean;
}

/** AI assist usage entry */
export interface AIAssistUsageEntry {
  field: string;
  step: WizardStep;
  action: 'improve' | 'professional' | 'expand' | 'shorten' | 'tone_change';
  accepted: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Error rate threshold that triggers a critical alert (5%) */
export const ERROR_RATE_THRESHOLD = 0.05;

/** API response time threshold that triggers a warning alert (2000ms) */
export const RESPONSE_TIME_THRESHOLD_MS = 2000;

/** Auto-save failure rate threshold for warning (1%) */
export const AUTO_SAVE_FAILURE_THRESHOLD = 0.01;

/** Window size for rolling error rate calculation (5 minutes) */
export const ERROR_RATE_WINDOW_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Event Names
// ---------------------------------------------------------------------------

const EVENTS = {
  FORM_SESSION_STARTED: 'hostspace_form_session_started',
  FORM_STEP_STARTED: 'hostspace_form_step_started',
  FORM_STEP_COMPLETED: 'hostspace_form_step_completed',
  FORM_ABANDONED: 'hostspace_form_abandoned',
  FORM_SUBMITTED: 'hostspace_form_submitted',
  FORM_VALIDATION_ERROR: 'hostspace_form_validation_error',
  FORM_AUTO_SAVE: 'hostspace_form_auto_save',
  FORM_API_CALL: 'hostspace_form_api_call',
  FORM_UPLOAD: 'hostspace_form_upload',
  FORM_AI_ASSIST: 'hostspace_form_ai_assist',
  FORM_HELP_CLICK: 'hostspace_form_help_click',
  FORM_ALERT_TRIGGERED: 'hostspace_form_alert_triggered',
} as const;

// ---------------------------------------------------------------------------
// Internal State (session-scoped rolling counters for threshold checks)
// ---------------------------------------------------------------------------

interface RollingCounter {
  total: number;
  failures: number;
  timestamps: number[];
}

const rollingCounters: Record<string, RollingCounter> = {
  autoSave: { total: 0, failures: 0, timestamps: [] },
  apiCalls: { total: 0, failures: 0, timestamps: [] },
  uploads: { total: 0, failures: 0, timestamps: [] },
};

/** Step timings for the current session */
const stepTimings: Map<WizardStep, StepTiming> = new Map();

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Get current device info for analytics context.
 */
export function getDeviceInfo(): DeviceInfo {
  const platform = Platform.OS === 'ios'
    ? 'ios'
    : Platform.OS === 'android'
      ? 'android'
      : 'web';

  return {
    platform,
    userAgent: Platform.OS === 'web'
      ? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
      : undefined,
    screenWidth: Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.innerWidth
      : undefined,
    screenHeight: Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.innerHeight
      : undefined,
  };
}

/**
 * Generate a unique session ID for form analytics tracking.
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `fs_${timestamp}_${random}`;
}

/**
 * Calculate error rate from rolling counter within the time window.
 */
function calculateErrorRate(counter: RollingCounter): number {
  if (counter.total === 0) return 0;
  return counter.failures / counter.total;
}

/**
 * Prune old entries from rolling counter timestamps.
 */
function pruneOldEntries(counter: RollingCounter): void {
  const cutoff = Date.now() - ERROR_RATE_WINDOW_MS;
  counter.timestamps = counter.timestamps.filter((t) => t > cutoff);
}

// ---------------------------------------------------------------------------
// Core Tracking Functions
// ---------------------------------------------------------------------------

/**
 * Track form session start.
 * Call when the wizard is initialized for a new or resumed session.
 */
export function trackFormSessionStarted(context: FormSessionContext): void {
  captureEvent(EVENTS.FORM_SESSION_STARTED, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    draft_id: context.draftId ?? null,
    profile_id: context.profileId ?? null,
    platform: context.device.platform,
    screen_width: context.device.screenWidth ?? null,
    screen_height: context.device.screenHeight ?? null,
    user_agent: context.device.userAgent ?? null,
  });
}

/**
 * Track when a user starts a wizard step.
 * Records the start time for duration calculation.
 */
export function trackStepStarted(
  context: FormSessionContext,
  step: WizardStep,
): void {
  const timing: StepTiming = {
    step,
    startedAt: Date.now(),
  };
  stepTimings.set(step, timing);

  captureEvent(EVENTS.FORM_STEP_STARTED, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    step,
    platform: context.device.platform,
  });
}

/**
 * Track when a user completes a wizard step.
 * Calculates time spent on the step.
 */
export function trackStepCompleted(
  context: FormSessionContext,
  step: WizardStep,
): void {
  const timing = stepTimings.get(step);
  const now = Date.now();
  const durationMs = timing ? now - timing.startedAt : undefined;

  if (timing) {
    timing.completedAt = now;
    timing.durationMs = durationMs;
  }

  captureEvent(EVENTS.FORM_STEP_COMPLETED, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    step,
    duration_ms: durationMs ?? null,
    platform: context.device.platform,
  });
}

/**
 * Track form abandonment.
 * Call when the user exits the wizard without completing.
 */
export function trackFormAbandoned(
  context: FormSessionContext,
  lastStep: WizardStep,
  reason?: string,
): void {
  const timing = stepTimings.get(lastStep);
  const timeOnLastStep = timing ? Date.now() - timing.startedAt : undefined;

  captureEvent(EVENTS.FORM_ABANDONED, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    last_step: lastStep,
    time_on_last_step_ms: timeOnLastStep ?? null,
    reason: reason ?? null,
    platform: context.device.platform,
  });
}

/**
 * Track successful form submission (publish).
 */
export function trackFormSubmitted(
  context: FormSessionContext,
  totalDurationMs: number,
): void {
  captureEvent(EVENTS.FORM_SUBMITTED, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    total_duration_ms: totalDurationMs,
    platform: context.device.platform,
    draft_id: context.draftId ?? null,
    profile_id: context.profileId ?? null,
  });
}

/**
 * Track a validation error occurrence.
 * Tracks frequency by field to identify problematic fields.
 */
export function trackValidationError(
  context: FormSessionContext,
  entry: ValidationErrorEntry,
): void {
  captureEvent(EVENTS.FORM_VALIDATION_ERROR, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    field: entry.field,
    step: entry.step,
    error_type: entry.errorType,
    message: entry.message ?? null,
    platform: context.device.platform,
  });
}

/**
 * Track auto-save attempt (success or failure).
 * Monitors auto-save reliability and triggers alerts on high failure rates.
 */
export function trackAutoSave(
  context: FormSessionContext,
  status: AutoSaveStatus,
  durationMs?: number,
  errorMessage?: string,
): void {
  const counter = rollingCounters.autoSave;
  counter.total += 1;
  counter.timestamps.push(Date.now());
  if (status === 'failure') {
    counter.failures += 1;
  }

  captureEvent(EVENTS.FORM_AUTO_SAVE, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    status,
    duration_ms: durationMs ?? null,
    error_message: errorMessage ?? null,
    platform: context.device.platform,
  });

  // Check threshold
  pruneOldEntries(counter);
  const errorRate = calculateErrorRate(counter);
  if (errorRate > AUTO_SAVE_FAILURE_THRESHOLD && counter.total >= 10) {
    trackAlertTriggered(context, 'warning', 'auto_save_failure_rate', errorRate);
  }
}

/**
 * Track API call timing and success/failure.
 * Monitors response times and triggers alerts when thresholds are exceeded.
 */
export function trackApiCall(
  context: FormSessionContext,
  entry: ApiTimingEntry,
): void {
  const counter = rollingCounters.apiCalls;
  counter.total += 1;
  counter.timestamps.push(Date.now());
  if (!entry.success) {
    counter.failures += 1;
  }

  captureEvent(EVENTS.FORM_API_CALL, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    endpoint: entry.endpoint,
    method: entry.method,
    duration_ms: entry.durationMs,
    status_code: entry.statusCode,
    success: entry.success,
    platform: context.device.platform,
  });

  // Check response time threshold
  if (entry.durationMs > RESPONSE_TIME_THRESHOLD_MS) {
    trackAlertTriggered(
      context,
      'warning',
      'api_response_time',
      entry.durationMs / 1000,
      { endpoint: entry.endpoint, method: entry.method },
    );
  }

  // Check error rate threshold
  pruneOldEntries(counter);
  const errorRate = calculateErrorRate(counter);
  if (errorRate > ERROR_RATE_THRESHOLD && counter.total >= 10) {
    trackAlertTriggered(context, 'critical', 'api_error_rate', errorRate);
  }
}

/**
 * Track file upload attempt (success or failure).
 */
export function trackUpload(
  context: FormSessionContext,
  status: UploadStatus,
  fileType: string,
  fileSizeBytes?: number,
  durationMs?: number,
  errorMessage?: string,
): void {
  const counter = rollingCounters.uploads;
  counter.total += 1;
  counter.timestamps.push(Date.now());
  if (status === 'failure') {
    counter.failures += 1;
  }

  captureEvent(EVENTS.FORM_UPLOAD, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    status,
    file_type: fileType,
    file_size_bytes: fileSizeBytes ?? null,
    duration_ms: durationMs ?? null,
    error_message: errorMessage ?? null,
    platform: context.device.platform,
  });

  // Check upload failure threshold
  pruneOldEntries(counter);
  const errorRate = calculateErrorRate(counter);
  if (errorRate > ERROR_RATE_THRESHOLD && counter.total >= 5) {
    trackAlertTriggered(context, 'warning', 'upload_failure_rate', errorRate);
  }
}

/**
 * Track AI assist usage on a field.
 */
export function trackAIAssistUsage(
  context: FormSessionContext,
  entry: AIAssistUsageEntry,
): void {
  captureEvent(EVENTS.FORM_AI_ASSIST, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    field: entry.field,
    step: entry.step,
    action: entry.action,
    accepted: entry.accepted,
    platform: context.device.platform,
  });
}

/**
 * Track help button click or support request.
 */
export function trackHelpClick(
  context: FormSessionContext,
  step: WizardStep,
  action: 'help_opened' | 'faq_viewed' | 'support_requested' | 'video_watched',
): void {
  captureEvent(EVENTS.FORM_HELP_CLICK, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    step,
    action,
    platform: context.device.platform,
  });
}

/**
 * Track when an alert threshold is triggered.
 * This is an internal event for monitoring alert frequency.
 */
export function trackAlertTriggered(
  context: FormSessionContext,
  severity: AlertSeverity,
  alertType: string,
  value: number,
  metadata?: Record<string, unknown>,
): void {
  captureEvent(EVENTS.FORM_ALERT_TRIGGERED, {
    session_id: context.sessionId,
    user_id: context.userId,
    entity_type: context.entityType,
    severity,
    alert_type: alertType,
    value,
    platform: context.device.platform,
    ...(metadata ?? {}),
  });
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

/**
 * Reset all rolling counters and step timings.
 * Call when starting a new form session.
 */
export function resetSessionCounters(): void {
  Object.values(rollingCounters).forEach((counter) => {
    counter.total = 0;
    counter.failures = 0;
    counter.timestamps = [];
  });
  stepTimings.clear();
}

/**
 * Get current session metrics summary.
 * Useful for debugging and dashboard display.
 */
export function getSessionMetrics(): {
  autoSaveErrorRate: number;
  apiErrorRate: number;
  uploadErrorRate: number;
  stepTimings: StepTiming[];
  totalAutoSaves: number;
  totalApiCalls: number;
  totalUploads: number;
} {
  return {
    autoSaveErrorRate: calculateErrorRate(rollingCounters.autoSave),
    apiErrorRate: calculateErrorRate(rollingCounters.apiCalls),
    uploadErrorRate: calculateErrorRate(rollingCounters.uploads),
    stepTimings: Array.from(stepTimings.values()),
    totalAutoSaves: rollingCounters.autoSave.total,
    totalApiCalls: rollingCounters.apiCalls.total,
    totalUploads: rollingCounters.uploads.total,
  };
}
