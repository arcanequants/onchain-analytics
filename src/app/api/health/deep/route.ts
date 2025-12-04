/**
 * Deep Health Check Endpoint
 *
 * Phase 4, Week 8 Extended - Backend Engineering Checklist
 *
 * Features:
 * - Validates all critical dependencies
 * - Returns detailed status for each service
 * - Supports degraded mode detection
 * - Circuit breaker state visibility
 * - Timeout handling for each check
 */

import { NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  message?: string;
  details?: Record<string, unknown>;
  lastChecked: string;
}

interface HealthCheckResponse {
  status: ServiceStatus;
  timestamp: string;
  version: string;
  uptime: number;
  services: ServiceCheck[];
  circuitBreakers: CircuitBreakerStatus[];
  degradedMode: boolean;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

interface CircuitBreakerStatus {
  name: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailure?: string;
  nextRetry?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHECK_TIMEOUT_MS = 5000;
const APP_VERSION = process.env.npm_package_version || '1.0.0';
const START_TIME = Date.now();

// ============================================================================
// SERVICE CHECKS
// ============================================================================

async function checkWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  serviceName: string
): Promise<{ result?: T; error?: string; latencyMs: number }> {
  const start = Date.now();

  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ]);
    return { result, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : `${serviceName} check failed`,
      latencyMs: Date.now() - start,
    };
  }
}

async function checkSupabase(): Promise<ServiceCheck> {
  const start = Date.now();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'supabase',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: 'Missing Supabase configuration',
        lastChecked: new Date().toISOString(),
      };
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return {
        name: 'supabase',
        status: latencyMs > 1000 ? 'degraded' : 'healthy',
        latencyMs,
        message: latencyMs > 1000 ? 'High latency detected' : 'Connected',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: 'supabase',
      status: 'unhealthy',
      latencyMs,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'supabase',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const start = Date.now();

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return {
        name: 'redis',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: 'Missing Redis configuration',
        lastChecked: new Date().toISOString(),
      };
    }

    const response = await fetch(`${redisUrl}/ping`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return {
        name: 'redis',
        status: latencyMs > 500 ? 'degraded' : 'healthy',
        latencyMs,
        message: latencyMs > 500 ? 'High latency detected' : 'Connected',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: 'redis',
      status: 'unhealthy',
      latencyMs,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkOpenAI(): Promise<ServiceCheck> {
  const start = Date.now();

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        name: 'openai',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: 'Missing API key',
        lastChecked: new Date().toISOString(),
      };
    }

    // Use models endpoint for lightweight check
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return {
        name: 'openai',
        status: latencyMs > 2000 ? 'degraded' : 'healthy',
        latencyMs,
        message: latencyMs > 2000 ? 'High latency detected' : 'Available',
        lastChecked: new Date().toISOString(),
      };
    }

    if (response.status === 429) {
      return {
        name: 'openai',
        status: 'degraded',
        latencyMs,
        message: 'Rate limited',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: 'openai',
      status: 'unhealthy',
      latencyMs,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'openai',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkAnthropic(): Promise<ServiceCheck> {
  const start = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        name: 'anthropic',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: 'Missing API key',
        lastChecked: new Date().toISOString(),
      };
    }

    // Anthropic doesn't have a models endpoint, so we check the API base
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;

    // Even an error response means the API is reachable
    if (response.ok || response.status === 400) {
      return {
        name: 'anthropic',
        status: latencyMs > 2000 ? 'degraded' : 'healthy',
        latencyMs,
        message: latencyMs > 2000 ? 'High latency detected' : 'Available',
        lastChecked: new Date().toISOString(),
      };
    }

    if (response.status === 429) {
      return {
        name: 'anthropic',
        status: 'degraded',
        latencyMs,
        message: 'Rate limited',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: 'anthropic',
      status: 'unhealthy',
      latencyMs,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'anthropic',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkStripe(): Promise<ServiceCheck> {
  const start = Date.now();

  try {
    const apiKey = process.env.STRIPE_SECRET_KEY;

    if (!apiKey) {
      return {
        name: 'stripe',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: 'Missing API key',
        lastChecked: new Date().toISOString(),
      };
    }

    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return {
        name: 'stripe',
        status: latencyMs > 1000 ? 'degraded' : 'healthy',
        latencyMs,
        message: latencyMs > 1000 ? 'High latency detected' : 'Connected',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: 'stripe',
      status: 'unhealthy',
      latencyMs,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'stripe',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkResend(): Promise<ServiceCheck> {
  const start = Date.now();

  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return {
        name: 'resend',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: 'Missing API key',
        lastChecked: new Date().toISOString(),
      };
    }

    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return {
        name: 'resend',
        status: latencyMs > 1000 ? 'degraded' : 'healthy',
        latencyMs,
        message: latencyMs > 1000 ? 'High latency detected' : 'Connected',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: 'resend',
      status: 'unhealthy',
      latencyMs,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'resend',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

// ============================================================================
// CIRCUIT BREAKER STATUS (connected to real circuit breakers)
// ============================================================================

import { getCircuitBreakerHealthStatus } from '@/lib/ai/circuit-breaker';

function getCircuitBreakerStatus(): CircuitBreakerStatus[] {
  // Get real circuit breaker status from the global registry
  return getCircuitBreakerHealthStatus();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET() {
  const startTime = Date.now();

  // Run all checks in parallel
  const [supabase, redis, openai, anthropic, stripe, resend] = await Promise.all([
    checkSupabase(),
    checkRedis(),
    checkOpenAI(),
    checkAnthropic(),
    checkStripe(),
    checkResend(),
  ]);

  const services: ServiceCheck[] = [supabase, redis, openai, anthropic, stripe, resend];
  const circuitBreakers = getCircuitBreakerStatus();

  // Calculate summary
  const summary = {
    total: services.length,
    healthy: services.filter(s => s.status === 'healthy').length,
    degraded: services.filter(s => s.status === 'degraded').length,
    unhealthy: services.filter(s => s.status === 'unhealthy').length,
  };

  // Determine overall status
  let overallStatus: ServiceStatus = 'healthy';
  const criticalServices = ['supabase', 'redis'];
  const criticalUnhealthy = services.filter(
    s => criticalServices.includes(s.name) && s.status === 'unhealthy'
  );

  if (criticalUnhealthy.length > 0) {
    overallStatus = 'unhealthy';
  } else if (summary.unhealthy > 0 || summary.degraded > 0) {
    overallStatus = 'degraded';
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    services,
    circuitBreakers,
    degradedMode: overallStatus === 'degraded',
    summary,
  };

  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Health-Check-Duration-Ms': String(Date.now() - startTime),
    },
  });
}
