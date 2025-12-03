/**
 * Idempotency Middleware
 *
 * Phase 4, Week 8 Extended - Backend Engineering Checklist
 *
 * Features:
 * - Idempotency key validation
 * - Request deduplication
 * - Response caching for replays
 * - 24h TTL for idempotency records
 * - Concurrent request handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { idempotencyConflict, badRequest, problemDetailsResponse } from '@/lib/errors/problem-details';

// ============================================================================
// TYPES
// ============================================================================

export interface IdempotencyRecord {
  key: string;
  status: 'processing' | 'completed' | 'failed';
  requestHash: string;
  response?: StoredResponse;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

export interface StoredResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface IdempotencyConfig {
  headerName?: string;
  ttlSeconds?: number;
  storage?: IdempotencyStorage;
  hashRequest?: (req: NextRequest) => Promise<string>;
}

export interface IdempotencyStorage {
  get(key: string): Promise<IdempotencyRecord | null>;
  set(key: string, record: IdempotencyRecord): Promise<void>;
  update(key: string, updates: Partial<IdempotencyRecord>): Promise<void>;
  delete(key: string): Promise<void>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<IdempotencyConfig, 'storage'>> & { storage?: IdempotencyStorage } = {
  headerName: 'Idempotency-Key',
  ttlSeconds: 86400, // 24 hours
  hashRequest: defaultHashRequest,
};

// ============================================================================
// IN-MEMORY STORAGE (for development/testing)
// ============================================================================

class InMemoryIdempotencyStorage implements IdempotencyStorage {
  private records: Map<string, IdempotencyRecord> = new Map();

  async get(key: string): Promise<IdempotencyRecord | null> {
    const record = this.records.get(key);
    if (!record) return null;

    // Check expiration
    if (new Date(record.expiresAt) < new Date()) {
      this.records.delete(key);
      return null;
    }

    return record;
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    this.records.set(key, record);
  }

  async update(key: string, updates: Partial<IdempotencyRecord>): Promise<void> {
    const existing = this.records.get(key);
    if (existing) {
      this.records.set(key, { ...existing, ...updates });
    }
  }

  async delete(key: string): Promise<void> {
    this.records.delete(key);
  }
}

// ============================================================================
// REDIS STORAGE
// ============================================================================

export class RedisIdempotencyStorage implements IdempotencyStorage {
  private redisUrl: string;
  private redisToken: string;

  constructor() {
    this.redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
    this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  }

  private async redis(command: string[]): Promise<unknown> {
    const response = await fetch(`${this.redisUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    const result = await response.json();
    return result.result;
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const data = await this.redis(['GET', `idempotency:${key}`]);
    if (!data) return null;
    return JSON.parse(data as string);
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    const ttl = Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000);
    await this.redis(['SET', `idempotency:${key}`, JSON.stringify(record), 'EX', String(ttl)]);
  }

  async update(key: string, updates: Partial<IdempotencyRecord>): Promise<void> {
    const existing = await this.get(key);
    if (existing) {
      const updated = { ...existing, ...updates };
      const ttl = Math.floor((new Date(updated.expiresAt).getTime() - Date.now()) / 1000);
      await this.redis(['SET', `idempotency:${key}`, JSON.stringify(updated), 'EX', String(ttl)]);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis(['DEL', `idempotency:${key}`]);
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

async function defaultHashRequest(req: NextRequest): Promise<string> {
  const body = await req.text();
  const content = `${req.method}:${req.url}:${body}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function isValidIdempotencyKey(key: string): boolean {
  // Must be between 1 and 255 characters
  if (key.length < 1 || key.length > 255) return false;

  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(key);
}

function serializeResponse(response: NextResponse): StoredResponse {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: response.status,
    headers,
    body: '', // Body will be set after cloning
  };
}

function deserializeResponse(stored: StoredResponse): NextResponse {
  return new NextResponse(stored.body, {
    status: stored.status,
    headers: {
      ...stored.headers,
      'Idempotency-Replayed': 'true',
    },
  });
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export function createIdempotencyMiddleware(config: IdempotencyConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const storage = mergedConfig.storage || new InMemoryIdempotencyStorage();

  return async function idempotencyMiddleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const idempotencyKey = req.headers.get(mergedConfig.headerName);

    // If no idempotency key, just execute the handler
    if (!idempotencyKey) {
      return handler();
    }

    // Validate the key format
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return problemDetailsResponse(
        badRequest('Invalid Idempotency-Key format. Must be 1-255 alphanumeric characters, hyphens, or underscores.')
      );
    }

    // Calculate request hash for validation
    const requestHash = await mergedConfig.hashRequest(req);

    // Check for existing record
    const existing = await storage.get(idempotencyKey);

    if (existing) {
      // Check if the request is the same
      if (existing.requestHash !== requestHash) {
        return problemDetailsResponse(
          idempotencyConflict(idempotencyKey, {
            detail: 'Idempotency key was used with a different request payload',
          })
        );
      }

      // If still processing, return conflict
      if (existing.status === 'processing') {
        return problemDetailsResponse(
          idempotencyConflict(idempotencyKey, {
            detail: 'Request with this idempotency key is still being processed',
          })
        );
      }

      // If completed, replay the response
      if (existing.status === 'completed' && existing.response) {
        return deserializeResponse(existing.response);
      }

      // If failed, allow retry
      if (existing.status === 'failed') {
        await storage.delete(idempotencyKey);
      }
    }

    // Create new record with processing status
    const now = new Date();
    const expiresAt = new Date(now.getTime() + mergedConfig.ttlSeconds * 1000);

    const record: IdempotencyRecord = {
      key: idempotencyKey,
      status: 'processing',
      requestHash,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await storage.set(idempotencyKey, record);

    try {
      // Execute the handler
      const response = await handler();

      // Store the response
      const storedResponse = serializeResponse(response);

      // Clone response to read body
      const clonedResponse = response.clone();
      storedResponse.body = await clonedResponse.text();

      await storage.update(idempotencyKey, {
        status: 'completed',
        response: storedResponse,
        completedAt: new Date().toISOString(),
      });

      // Add idempotency header to response
      const finalResponse = new NextResponse(storedResponse.body, {
        status: response.status,
        headers: response.headers,
      });
      finalResponse.headers.set('Idempotency-Key', idempotencyKey);

      return finalResponse;
    } catch (error) {
      // Mark as failed
      await storage.update(idempotencyKey, {
        status: 'failed',
      });

      throw error;
    }
  };
}

// ============================================================================
// WRAPPER FOR API ROUTES
// ============================================================================

export function withIdempotency(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: IdempotencyConfig
) {
  const middleware = createIdempotencyMiddleware(config);

  return async function (req: NextRequest): Promise<NextResponse> {
    return middleware(req, () => handler(req));
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  InMemoryIdempotencyStorage,
  isValidIdempotencyKey,
};

export default {
  createIdempotencyMiddleware,
  withIdempotency,
  RedisIdempotencyStorage,
  InMemoryIdempotencyStorage,
};
