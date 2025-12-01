/**
 * Webhook Service
 *
 * Business logic for webhook management and delivery
 *
 * Phase 2, Week 8, Day 1
 */

import * as crypto from 'crypto';
import {
  type Webhook,
  type WebhookCreate,
  type WebhookUpdate,
  type WebhookDelivery,
  type WebhookPayload,
  type WebhookEventType,
  type WebhookStats,
  type WebhookSignature,
  type DeliveryStatus,
  WEBHOOK_EVENTS,
  WEBHOOK_SECRET_LENGTH,
  WEBHOOK_TIMEOUT_MS,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAYS_MS,
  MAX_WEBHOOKS_PER_USER,
  SIGNATURE_TOLERANCE_SECONDS,
} from './types';

// ================================================================
// MOCK DATA STORE
// ================================================================

const mockWebhooks: Map<string, Webhook> = new Map();
const mockDeliveries: WebhookDelivery[] = [];

// Initialize test data
function initMockData() {
  const testWebhook: Webhook = {
    id: 'wh_test123',
    userId: 'user-1',
    url: 'https://example.com/webhooks',
    events: ['score.created', 'score.updated'],
    secret: 'whsec_testsecret12345678901234567890',
    isActive: true,
    description: 'Test webhook',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastTriggeredAt: null,
    failureCount: 0,
  };
  mockWebhooks.set(testWebhook.id, testWebhook);
}

initMockData();

// ================================================================
// SECRET GENERATION
// ================================================================

/**
 * Generate a webhook secret
 */
export function generateWebhookSecret(): string {
  const randomBytes = crypto.randomBytes(WEBHOOK_SECRET_LENGTH);
  return `whsec_${randomBytes.toString('hex')}`;
}

/**
 * Validate webhook secret format
 */
export function isValidSecretFormat(secret: string): boolean {
  return /^whsec_[a-f0-9]{64}$/.test(secret);
}

// ================================================================
// SIGNATURE GENERATION & VERIFICATION
// ================================================================

/**
 * Generate webhook signature
 */
export function generateSignature(
  payload: string,
  secret: string,
  timestamp: number
): WebhookSignature {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return {
    timestamp,
    signature: `v1=${signature}`,
  };
}

/**
 * Verify webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = SIGNATURE_TOLERANCE_SECONDS
): { valid: boolean; error?: string } {
  // Parse signature header
  const signatureParts = signature.split(',');
  const timestampPart = signatureParts.find((p) => p.startsWith('t='));
  const signaturePart = signatureParts.find((p) => p.startsWith('v1='));

  if (!timestampPart || !signaturePart) {
    return { valid: false, error: 'Invalid signature format' };
  }

  const timestamp = parseInt(timestampPart.slice(2), 10);
  const receivedSignature = signaturePart;

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    return { valid: false, error: 'Signature timestamp expired' };
  }

  // Verify signature
  const expected = generateSignature(payload, secret, timestamp);

  // Check length first to avoid timingSafeEqual error
  const expectedBuffer = Buffer.from(expected.signature);
  const receivedBuffer = Buffer.from(receivedSignature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return { valid: false, error: 'Invalid signature' };
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isValid) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}

/**
 * Construct signature header value
 */
export function constructSignatureHeader(
  payload: string,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = generateSignature(payload, secret, timestamp);
  return `t=${timestamp},${sig.signature}`;
}

// ================================================================
// WEBHOOK MANAGEMENT
// ================================================================

/**
 * Create a new webhook
 */
export async function createWebhook(data: WebhookCreate): Promise<Webhook> {
  // Check user limit
  const userWebhooks = await getUserWebhooks(data.userId);
  if (userWebhooks.length >= MAX_WEBHOOKS_PER_USER) {
    throw new Error(`Maximum webhooks limit (${MAX_WEBHOOKS_PER_USER}) reached`);
  }

  // Validate URL
  if (!isValidWebhookUrl(data.url)) {
    throw new Error('Invalid webhook URL');
  }

  // Validate events
  if (!data.events.every((e) => WEBHOOK_EVENTS.includes(e))) {
    throw new Error('Invalid event type');
  }

  const webhook: Webhook = {
    id: `wh_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId: data.userId,
    url: data.url,
    events: data.events,
    secret: generateWebhookSecret(),
    isActive: true,
    description: data.description,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastTriggeredAt: null,
    failureCount: 0,
    metadata: data.metadata,
  };

  mockWebhooks.set(webhook.id, webhook);
  return webhook;
}

/**
 * Get webhook by ID
 */
export async function getWebhook(webhookId: string): Promise<Webhook | null> {
  return mockWebhooks.get(webhookId) || null;
}

/**
 * Get user's webhooks
 */
export async function getUserWebhooks(userId: string): Promise<Webhook[]> {
  return Array.from(mockWebhooks.values()).filter((w) => w.userId === userId);
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  data: WebhookUpdate
): Promise<Webhook | null> {
  const webhook = await getWebhook(webhookId);
  if (!webhook) return null;

  if (data.url && !isValidWebhookUrl(data.url)) {
    throw new Error('Invalid webhook URL');
  }

  if (data.events && !data.events.every((e) => WEBHOOK_EVENTS.includes(e))) {
    throw new Error('Invalid event type');
  }

  const updated: Webhook = {
    ...webhook,
    ...data,
    updatedAt: new Date(),
  };

  mockWebhooks.set(webhookId, updated);
  return updated;
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: string): Promise<boolean> {
  return mockWebhooks.delete(webhookId);
}

/**
 * Regenerate webhook secret
 */
export async function regenerateSecret(webhookId: string): Promise<string | null> {
  const webhook = await getWebhook(webhookId);
  if (!webhook) return null;

  const newSecret = generateWebhookSecret();
  webhook.secret = newSecret;
  webhook.updatedAt = new Date();

  mockWebhooks.set(webhookId, webhook);
  return newSecret;
}

// ================================================================
// URL VALIDATION
// ================================================================

/**
 * Validate webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS (except localhost for testing)
    if (parsed.protocol !== 'https:' && !parsed.hostname.includes('localhost')) {
      return false;
    }

    // No private IP ranges (basic check)
    const hostname = parsed.hostname;
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname === '127.0.0.1'
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ================================================================
// EVENT DELIVERY
// ================================================================

/**
 * Create webhook payload
 */
export function createPayload(
  eventType: WebhookEventType,
  data: Record<string, unknown>,
  webhookId: string,
  attemptNumber: number = 1
): WebhookPayload {
  return {
    id: `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
    meta: {
      webhookId,
      attemptNumber,
      apiVersion: '1.0.0',
    },
  };
}

/**
 * Trigger event for all subscribed webhooks
 */
export async function triggerEvent(
  userId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<WebhookDelivery[]> {
  const webhooks = await getUserWebhooks(userId);
  const activeWebhooks = webhooks.filter(
    (w) => w.isActive && w.events.includes(eventType)
  );

  const deliveries: WebhookDelivery[] = [];

  for (const webhook of activeWebhooks) {
    const delivery = await deliverEvent(webhook, eventType, data);
    deliveries.push(delivery);
  }

  return deliveries;
}

/**
 * Deliver event to a single webhook
 */
export async function deliverEvent(
  webhook: Webhook,
  eventType: WebhookEventType,
  data: Record<string, unknown>,
  attemptNumber: number = 1
): Promise<WebhookDelivery> {
  const payload = createPayload(eventType, data, webhook.id, attemptNumber);
  const payloadString = JSON.stringify(payload);

  const delivery: WebhookDelivery = {
    id: `del_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    webhookId: webhook.id,
    eventType,
    payload,
    status: 'sending',
    statusCode: null,
    responseBody: null,
    responseTimeMs: null,
    error: null,
    attemptCount: attemptNumber,
    nextRetryAt: null,
    createdAt: new Date(),
    completedAt: null,
  };

  mockDeliveries.push(delivery);

  try {
    const startTime = Date.now();

    // In production, this would make an actual HTTP request
    // For testing, we simulate success/failure
    const response = await simulateDelivery(webhook.url, payloadString, webhook.secret);

    delivery.responseTimeMs = Date.now() - startTime;
    delivery.statusCode = response.statusCode;
    delivery.responseBody = response.body;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      delivery.status = 'success';
      delivery.completedAt = new Date();

      // Update webhook
      webhook.lastTriggeredAt = new Date();
      webhook.failureCount = 0;
      mockWebhooks.set(webhook.id, webhook);
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    delivery.status = attemptNumber >= MAX_RETRY_ATTEMPTS ? 'failed' : 'retrying';
    delivery.error = error instanceof Error ? error.message : 'Unknown error';

    if (attemptNumber < MAX_RETRY_ATTEMPTS) {
      const retryDelay = RETRY_DELAYS_MS[attemptNumber - 1] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      delivery.nextRetryAt = new Date(Date.now() + retryDelay);
    } else {
      delivery.completedAt = new Date();
    }

    // Update webhook failure count
    webhook.failureCount++;
    mockWebhooks.set(webhook.id, webhook);
  }

  return delivery;
}

/**
 * Simulate webhook delivery (for testing)
 */
async function simulateDelivery(
  url: string,
  payload: string,
  secret: string
): Promise<{ statusCode: number; body: string }> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Simulate different responses based on URL patterns
  if (url.includes('fail')) {
    return { statusCode: 500, body: 'Internal Server Error' };
  }

  if (url.includes('timeout')) {
    throw new Error('Connection timeout');
  }

  return { statusCode: 200, body: 'OK' };
}

/**
 * Retry failed delivery
 */
export async function retryDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
  const delivery = mockDeliveries.find((d) => d.id === deliveryId);
  if (!delivery || delivery.status === 'success') return null;

  const webhook = await getWebhook(delivery.webhookId);
  if (!webhook) return null;

  return deliverEvent(
    webhook,
    delivery.eventType,
    delivery.payload.data,
    delivery.attemptCount + 1
  );
}

/**
 * Get delivery by ID
 */
export async function getDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
  return mockDeliveries.find((d) => d.id === deliveryId) || null;
}

/**
 * Get deliveries for a webhook
 */
export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 20
): Promise<WebhookDelivery[]> {
  return mockDeliveries
    .filter((d) => d.webhookId === webhookId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// ================================================================
// STATS
// ================================================================

/**
 * Get webhook statistics
 */
export async function getWebhookStats(webhookId: string): Promise<WebhookStats | null> {
  const webhook = await getWebhook(webhookId);
  if (!webhook) return null;

  const deliveries = mockDeliveries.filter((d) => d.webhookId === webhookId);

  const successful = deliveries.filter((d) => d.status === 'success');
  const failed = deliveries.filter((d) => d.status === 'failed');

  const responseTimes = successful
    .filter((d) => d.responseTimeMs !== null)
    .map((d) => d.responseTimeMs!);

  const averageResponseTimeMs =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const sortedDeliveries = [...deliveries].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return {
    webhookId,
    totalDeliveries: deliveries.length,
    successfulDeliveries: successful.length,
    failedDeliveries: failed.length,
    averageResponseTimeMs: Math.round(averageResponseTimeMs),
    successRate: deliveries.length > 0 ? (successful.length / deliveries.length) * 100 : 0,
    lastDeliveryAt: sortedDeliveries[0]?.createdAt || null,
    lastSuccessAt: successful.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.completedAt || null,
    lastFailureAt: failed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.completedAt || null,
  };
}

// ================================================================
// TEST WEBHOOK
// ================================================================

/**
 * Send test event to webhook
 */
export async function sendTestEvent(webhookId: string): Promise<WebhookDelivery | null> {
  const webhook = await getWebhook(webhookId);
  if (!webhook) return null;

  const testData = {
    message: 'This is a test webhook event',
    timestamp: new Date().toISOString(),
    webhookId: webhook.id,
  };

  // Use the first subscribed event type or a generic test
  const eventType = webhook.events[0] || 'score.created';

  return deliverEvent(webhook, eventType, testData);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  generateWebhookSecret,
  isValidSecretFormat,
  generateSignature,
  verifySignature,
  constructSignatureHeader,
  createWebhook,
  getWebhook,
  getUserWebhooks,
  updateWebhook,
  deleteWebhook,
  regenerateSecret,
  isValidWebhookUrl,
  createPayload,
  triggerEvent,
  deliverEvent,
  retryDelivery,
  getDelivery,
  getWebhookDeliveries,
  getWebhookStats,
  sendTestEvent,
};
