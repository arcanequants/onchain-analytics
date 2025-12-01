/**
 * Webhook Types
 *
 * Type definitions for the webhook notification system
 *
 * Phase 2, Week 8, Day 1
 */

// ================================================================
// WEBHOOK EVENTS
// ================================================================

export const WEBHOOK_EVENTS = [
  'score.created',
  'score.updated',
  'brand.created',
  'brand.updated',
  'brand.deleted',
  'alert.triggered',
  'report.generated',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  'score.created': 'Score Created',
  'score.updated': 'Score Updated',
  'brand.created': 'Brand Created',
  'brand.updated': 'Brand Updated',
  'brand.deleted': 'Brand Deleted',
  'alert.triggered': 'Alert Triggered',
  'report.generated': 'Report Generated',
  'subscription.created': 'Subscription Created',
  'subscription.updated': 'Subscription Updated',
  'subscription.cancelled': 'Subscription Cancelled',
};

// ================================================================
// WEBHOOK
// ================================================================

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt: Date | null;
  failureCount: number;
  metadata?: Record<string, unknown>;
}

export interface WebhookCreate {
  userId: string;
  url: string;
  events: WebhookEventType[];
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookUpdate {
  url?: string;
  events?: WebhookEventType[];
  isActive?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ================================================================
// WEBHOOK DELIVERY
// ================================================================

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: WebhookPayload;
  status: DeliveryStatus;
  statusCode: number | null;
  responseBody: string | null;
  responseTimeMs: number | null;
  error: string | null;
  attemptCount: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
}

export type DeliveryStatus =
  | 'pending'
  | 'sending'
  | 'success'
  | 'failed'
  | 'retrying';

// ================================================================
// WEBHOOK PAYLOAD
// ================================================================

export interface WebhookPayload {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
  meta: {
    webhookId: string;
    attemptNumber: number;
    apiVersion: string;
  };
}

// ================================================================
// EVENT DATA TYPES
// ================================================================

export interface ScoreEventData {
  scoreId: string;
  brandId: string;
  brandName: string;
  overallScore: number;
  previousScore?: number;
  grade: string;
  categories: Record<string, number>;
}

export interface BrandEventData {
  brandId: string;
  brandName: string;
  industry?: string;
  website?: string;
}

export interface AlertEventData {
  alertId: string;
  brandId: string;
  brandName: string;
  alertType: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  threshold: number;
}

export interface ReportEventData {
  reportId: string;
  brandId: string;
  brandName: string;
  reportType: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface SubscriptionEventData {
  subscriptionId: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string;
}

// ================================================================
// WEBHOOK SIGNATURE
// ================================================================

export interface WebhookSignature {
  timestamp: number;
  signature: string;
  signatureV2?: string;
}

// ================================================================
// WEBHOOK STATS
// ================================================================

export interface WebhookStats {
  webhookId: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTimeMs: number;
  successRate: number;
  lastDeliveryAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
}

// ================================================================
// CONSTANTS
// ================================================================

export const WEBHOOK_SECRET_LENGTH = 32;
export const WEBHOOK_TIMEOUT_MS = 30000;
export const MAX_RETRY_ATTEMPTS = 5;
export const RETRY_DELAYS_MS = [
  1000,      // 1 second
  60000,     // 1 minute
  300000,    // 5 minutes
  3600000,   // 1 hour
  86400000,  // 24 hours
];

export const MAX_WEBHOOKS_PER_USER = 10;
export const SIGNATURE_TOLERANCE_SECONDS = 300; // 5 minutes
