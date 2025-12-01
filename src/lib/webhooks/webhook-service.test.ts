/**
 * Webhook Service Tests
 *
 * Phase 2, Week 8, Day 1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
  getDelivery,
  getWebhookDeliveries,
  getWebhookStats,
  sendTestEvent,
} from './webhook-service';
import { WEBHOOK_EVENTS } from './types';

// ================================================================
// SECRET GENERATION TESTS
// ================================================================

describe('generateWebhookSecret', () => {
  it('should generate a secret with correct prefix', () => {
    const secret = generateWebhookSecret();
    expect(secret.startsWith('whsec_')).toBe(true);
  });

  it('should generate a secret with correct length', () => {
    const secret = generateWebhookSecret();
    // whsec_ (6 chars) + 64 hex chars = 70 chars
    expect(secret.length).toBe(70);
  });

  it('should generate unique secrets', () => {
    const secrets = new Set<string>();
    for (let i = 0; i < 100; i++) {
      secrets.add(generateWebhookSecret());
    }
    expect(secrets.size).toBe(100);
  });
});

describe('isValidSecretFormat', () => {
  it('should accept valid secret format', () => {
    const secret = generateWebhookSecret();
    expect(isValidSecretFormat(secret)).toBe(true);
  });

  it('should reject invalid prefix', () => {
    expect(isValidSecretFormat('invalid_' + 'a'.repeat(64))).toBe(false);
  });

  it('should reject short secrets', () => {
    expect(isValidSecretFormat('whsec_abc')).toBe(false);
  });

  it('should reject non-hex characters', () => {
    expect(isValidSecretFormat('whsec_' + 'g'.repeat(64))).toBe(false);
  });
});

// ================================================================
// SIGNATURE TESTS
// ================================================================

describe('generateSignature', () => {
  it('should generate a signature object', () => {
    const sig = generateSignature('test payload', 'secret123', 1234567890);

    expect(sig.timestamp).toBe(1234567890);
    expect(sig.signature).toMatch(/^v1=[a-f0-9]+$/);
  });

  it('should generate consistent signatures', () => {
    const sig1 = generateSignature('payload', 'secret', 12345);
    const sig2 = generateSignature('payload', 'secret', 12345);

    expect(sig1.signature).toBe(sig2.signature);
  });

  it('should generate different signatures for different payloads', () => {
    const sig1 = generateSignature('payload1', 'secret', 12345);
    const sig2 = generateSignature('payload2', 'secret', 12345);

    expect(sig1.signature).not.toBe(sig2.signature);
  });

  it('should generate different signatures for different secrets', () => {
    const sig1 = generateSignature('payload', 'secret1', 12345);
    const sig2 = generateSignature('payload', 'secret2', 12345);

    expect(sig1.signature).not.toBe(sig2.signature);
  });
});

describe('verifySignature', () => {
  it('should verify valid signature', () => {
    const payload = 'test payload';
    const secret = 'mysecret';
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = generateSignature(payload, secret, timestamp);
    const header = `t=${timestamp},${sig.signature}`;

    const result = verifySignature(payload, header, secret);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid signature', () => {
    const payload = 'test payload';
    const secret = 'mysecret';
    const timestamp = Math.floor(Date.now() / 1000);
    const header = `t=${timestamp},v1=invalidsignature`;

    const result = verifySignature(payload, header, secret);
    expect(result.valid).toBe(false);
  });

  it('should reject expired timestamp', () => {
    const payload = 'test payload';
    const secret = 'mysecret';
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const sig = generateSignature(payload, secret, oldTimestamp);
    const header = `t=${oldTimestamp},${sig.signature}`;

    const result = verifySignature(payload, header, secret, 300);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('should reject missing timestamp', () => {
    const result = verifySignature('payload', 'v1=sig', 'secret');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });

  it('should reject missing signature', () => {
    const result = verifySignature('payload', 't=12345', 'secret');
    expect(result.valid).toBe(false);
  });
});

describe('constructSignatureHeader', () => {
  it('should construct valid signature header', () => {
    const header = constructSignatureHeader('payload', 'secret');

    expect(header).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
  });

  it('should be verifiable', () => {
    const payload = 'test payload';
    const secret = 'mysecret';
    const header = constructSignatureHeader(payload, secret);

    const result = verifySignature(payload, header, secret);
    expect(result.valid).toBe(true);
  });
});

// ================================================================
// URL VALIDATION TESTS
// ================================================================

describe('isValidWebhookUrl', () => {
  it('should accept HTTPS URLs', () => {
    expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true);
  });

  it('should accept localhost for testing', () => {
    expect(isValidWebhookUrl('http://localhost:3000/webhook')).toBe(true);
  });

  it('should reject HTTP URLs (non-localhost)', () => {
    expect(isValidWebhookUrl('http://example.com/webhook')).toBe(false);
  });

  it('should reject private IP ranges', () => {
    expect(isValidWebhookUrl('https://192.168.1.1/webhook')).toBe(false);
    expect(isValidWebhookUrl('https://10.0.0.1/webhook')).toBe(false);
    expect(isValidWebhookUrl('https://172.16.0.1/webhook')).toBe(false);
  });

  it('should reject 127.0.0.1', () => {
    expect(isValidWebhookUrl('https://127.0.0.1/webhook')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isValidWebhookUrl('not-a-url')).toBe(false);
    expect(isValidWebhookUrl('')).toBe(false);
  });
});

// ================================================================
// WEBHOOK MANAGEMENT TESTS
// ================================================================

describe('createWebhook', () => {
  it('should create a webhook', async () => {
    const webhook = await createWebhook({
      userId: 'user-create-test',
      url: 'https://example.com/hook',
      events: ['score.created'],
    });

    expect(webhook.id).toBeDefined();
    expect(webhook.url).toBe('https://example.com/hook');
    expect(webhook.events).toContain('score.created');
    expect(webhook.isActive).toBe(true);
    expect(webhook.secret).toMatch(/^whsec_/);
  });

  it('should set description', async () => {
    const webhook = await createWebhook({
      userId: 'user-desc-test',
      url: 'https://example.com/hook',
      events: ['score.created'],
      description: 'My test webhook',
    });

    expect(webhook.description).toBe('My test webhook');
  });

  it('should reject invalid URL', async () => {
    await expect(
      createWebhook({
        userId: 'user-invalid-url',
        url: 'http://insecure.com/hook',
        events: ['score.created'],
      })
    ).rejects.toThrow('Invalid webhook URL');
  });

  it('should reject invalid events', async () => {
    await expect(
      createWebhook({
        userId: 'user-invalid-event',
        url: 'https://example.com/hook',
        events: ['invalid.event' as any],
      })
    ).rejects.toThrow('Invalid event type');
  });
});

describe('getWebhook', () => {
  it('should return webhook by ID', async () => {
    const webhook = await getWebhook('wh_test123');

    expect(webhook).not.toBeNull();
    expect(webhook?.id).toBe('wh_test123');
  });

  it('should return null for non-existent webhook', async () => {
    const webhook = await getWebhook('wh_nonexistent');

    expect(webhook).toBeNull();
  });
});

describe('getUserWebhooks', () => {
  it('should return user webhooks', async () => {
    const webhooks = await getUserWebhooks('user-1');

    expect(Array.isArray(webhooks)).toBe(true);
    expect(webhooks.length).toBeGreaterThan(0);
    expect(webhooks.every((w) => w.userId === 'user-1')).toBe(true);
  });

  it('should return empty array for user with no webhooks', async () => {
    const webhooks = await getUserWebhooks('user-no-webhooks');

    expect(webhooks).toEqual([]);
  });
});

describe('updateWebhook', () => {
  it('should update webhook URL', async () => {
    const webhook = await createWebhook({
      userId: 'user-update-test',
      url: 'https://old.example.com/hook',
      events: ['score.created'],
    });

    const updated = await updateWebhook(webhook.id, {
      url: 'https://new.example.com/hook',
    });

    expect(updated?.url).toBe('https://new.example.com/hook');
  });

  it('should update webhook events', async () => {
    const webhook = await createWebhook({
      userId: 'user-update-events',
      url: 'https://example.com/hook',
      events: ['score.created'],
    });

    const updated = await updateWebhook(webhook.id, {
      events: ['score.created', 'score.updated'],
    });

    expect(updated?.events).toContain('score.updated');
  });

  it('should update isActive', async () => {
    const webhook = await createWebhook({
      userId: 'user-deactivate',
      url: 'https://example.com/hook',
      events: ['score.created'],
    });

    const updated = await updateWebhook(webhook.id, { isActive: false });

    expect(updated?.isActive).toBe(false);
  });

  it('should return null for non-existent webhook', async () => {
    const result = await updateWebhook('wh_nonexistent', { isActive: false });

    expect(result).toBeNull();
  });
});

describe('deleteWebhook', () => {
  it('should delete webhook', async () => {
    const webhook = await createWebhook({
      userId: 'user-delete',
      url: 'https://example.com/hook',
      events: ['score.created'],
    });

    const deleted = await deleteWebhook(webhook.id);
    expect(deleted).toBe(true);

    const retrieved = await getWebhook(webhook.id);
    expect(retrieved).toBeNull();
  });

  it('should return false for non-existent webhook', async () => {
    const result = await deleteWebhook('wh_nonexistent');

    expect(result).toBe(false);
  });
});

describe('regenerateSecret', () => {
  it('should generate new secret', async () => {
    const webhook = await createWebhook({
      userId: 'user-regen',
      url: 'https://example.com/hook',
      events: ['score.created'],
    });

    const oldSecret = webhook.secret;
    const newSecret = await regenerateSecret(webhook.id);

    expect(newSecret).not.toBe(oldSecret);
    expect(newSecret).toMatch(/^whsec_/);
  });

  it('should return null for non-existent webhook', async () => {
    const result = await regenerateSecret('wh_nonexistent');

    expect(result).toBeNull();
  });
});

// ================================================================
// PAYLOAD TESTS
// ================================================================

describe('createPayload', () => {
  it('should create payload with correct structure', () => {
    const payload = createPayload('score.created', { test: 'data' }, 'wh_123');

    expect(payload.id).toBeDefined();
    expect(payload.type).toBe('score.created');
    expect(payload.timestamp).toBeDefined();
    expect(payload.data).toEqual({ test: 'data' });
    expect(payload.meta.webhookId).toBe('wh_123');
    expect(payload.meta.attemptNumber).toBe(1);
    expect(payload.meta.apiVersion).toBe('1.0.0');
  });

  it('should include attempt number', () => {
    const payload = createPayload('score.updated', {}, 'wh_123', 3);

    expect(payload.meta.attemptNumber).toBe(3);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(createPayload('score.created', {}, 'wh_123').id);
    }
    expect(ids.size).toBe(100);
  });
});

// ================================================================
// EVENT DELIVERY TESTS
// ================================================================

describe('triggerEvent', () => {
  it('should trigger event for subscribed webhooks', async () => {
    const deliveries = await triggerEvent('user-1', 'score.created', { brandId: 'brand-1' });

    expect(Array.isArray(deliveries)).toBe(true);
  });

  it('should return empty for non-subscribed events', async () => {
    const deliveries = await triggerEvent('user-1', 'brand.deleted', { brandId: 'brand-1' });

    expect(deliveries).toEqual([]);
  });
});

describe('deliverEvent', () => {
  it('should deliver event successfully', async () => {
    const webhook = await createWebhook({
      userId: 'user-deliver',
      url: 'https://success.example.com/hook',
      events: ['score.created'],
    });

    const delivery = await deliverEvent(webhook, 'score.created', { brandId: 'brand-1' });

    expect(delivery.webhookId).toBe(webhook.id);
    expect(delivery.eventType).toBe('score.created');
    expect(delivery.status).toBe('success');
  });

  it('should handle delivery failure', async () => {
    const webhook = await createWebhook({
      userId: 'user-fail',
      url: 'https://fail.example.com/hook',
      events: ['score.created'],
    });

    const delivery = await deliverEvent(webhook, 'score.created', { brandId: 'brand-1' });

    expect(delivery.status).toBe('retrying');
    expect(delivery.error).toBeDefined();
  });
});

describe('getDelivery', () => {
  it('should return null for non-existent delivery', async () => {
    const delivery = await getDelivery('del_nonexistent');

    expect(delivery).toBeNull();
  });
});

describe('getWebhookDeliveries', () => {
  it('should return deliveries for webhook', async () => {
    const webhook = await createWebhook({
      userId: 'user-deliveries',
      url: 'https://success.example.com/hook',
      events: ['score.created'],
    });

    await deliverEvent(webhook, 'score.created', { test: 1 });
    await deliverEvent(webhook, 'score.created', { test: 2 });

    const deliveries = await getWebhookDeliveries(webhook.id);

    expect(deliveries.length).toBeGreaterThanOrEqual(2);
    expect(deliveries.every((d) => d.webhookId === webhook.id)).toBe(true);
  });

  it('should respect limit', async () => {
    const webhook = await createWebhook({
      userId: 'user-limit',
      url: 'https://success.example.com/hook',
      events: ['score.created'],
    });

    await deliverEvent(webhook, 'score.created', { test: 1 });
    await deliverEvent(webhook, 'score.created', { test: 2 });
    await deliverEvent(webhook, 'score.created', { test: 3 });

    const deliveries = await getWebhookDeliveries(webhook.id, 2);

    expect(deliveries.length).toBeLessThanOrEqual(2);
  });
});

// ================================================================
// STATS TESTS
// ================================================================

describe('getWebhookStats', () => {
  it('should return stats for webhook', async () => {
    const webhook = await createWebhook({
      userId: 'user-stats',
      url: 'https://success.example.com/hook',
      events: ['score.created'],
    });

    await deliverEvent(webhook, 'score.created', { test: 1 });

    const stats = await getWebhookStats(webhook.id);

    expect(stats).not.toBeNull();
    expect(stats?.webhookId).toBe(webhook.id);
    expect(stats?.totalDeliveries).toBeGreaterThan(0);
    expect(stats?.successRate).toBeGreaterThanOrEqual(0);
  });

  it('should return null for non-existent webhook', async () => {
    const stats = await getWebhookStats('wh_nonexistent');

    expect(stats).toBeNull();
  });
});

// ================================================================
// TEST EVENT TESTS
// ================================================================

describe('sendTestEvent', () => {
  it('should send test event', async () => {
    const delivery = await sendTestEvent('wh_test123');

    expect(delivery).not.toBeNull();
    expect(delivery?.payload.data.message).toContain('test');
  });

  it('should return null for non-existent webhook', async () => {
    const result = await sendTestEvent('wh_nonexistent');

    expect(result).toBeNull();
  });
});

// ================================================================
// WEBHOOK EVENTS CONSTANT TESTS
// ================================================================

describe('WEBHOOK_EVENTS', () => {
  it('should have score events', () => {
    expect(WEBHOOK_EVENTS).toContain('score.created');
    expect(WEBHOOK_EVENTS).toContain('score.updated');
  });

  it('should have brand events', () => {
    expect(WEBHOOK_EVENTS).toContain('brand.created');
    expect(WEBHOOK_EVENTS).toContain('brand.updated');
    expect(WEBHOOK_EVENTS).toContain('brand.deleted');
  });

  it('should have alert event', () => {
    expect(WEBHOOK_EVENTS).toContain('alert.triggered');
  });

  it('should have subscription events', () => {
    expect(WEBHOOK_EVENTS).toContain('subscription.created');
    expect(WEBHOOK_EVENTS).toContain('subscription.updated');
    expect(WEBHOOK_EVENTS).toContain('subscription.cancelled');
  });
});
