/**
 * Health Check Endpoint
 *
 * Phase 1, Week 2
 * GET /api/health - Service health check for uptime monitoring
 *
 * Checks:
 * 1. API is responding
 * 2. AI providers configured
 * 3. Environment variables set
 * 4. Memory usage (when available)
 *
 * Returns:
 * - 200 OK: All systems operational
 * - 503 Service Unavailable: Critical system down
 */

import { NextResponse } from 'next/server';

// ================================================================
// TYPES
// ================================================================

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    api: {
      status: 'pass' | 'fail';
      responseTimeMs: number;
    };
    aiProviders: {
      status: 'pass' | 'fail' | 'warn';
      openai: boolean;
      anthropic: boolean;
      message?: string;
    };
    environment: {
      status: 'pass' | 'fail';
      missing?: string[];
    };
    memory?: {
      status: 'pass' | 'warn';
      heapUsedMB: number;
      heapTotalMB: number;
      percentUsed: number;
    };
  };
  version: string;
  environment: string;
}

// ================================================================
// STARTUP TIME
// ================================================================

const startupTime = Date.now();

// ================================================================
// ROUTE HANDLER
// ================================================================

export async function GET() {
  const startTime = Date.now();

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startupTime) / 1000),
    checks: {
      api: {
        status: 'pass',
        responseTimeMs: 0,
      },
      aiProviders: {
        status: 'pass',
        openai: false,
        anthropic: false,
      },
      environment: {
        status: 'pass',
      },
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Check 1: API Response Time
  result.checks.api.responseTimeMs = Date.now() - startTime;

  // Check 2: AI Providers Configuration
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  result.checks.aiProviders.openai = hasOpenAI;
  result.checks.aiProviders.anthropic = hasAnthropic;

  if (hasOpenAI && hasAnthropic) {
    result.checks.aiProviders.status = 'pass';
    result.checks.aiProviders.message = 'Both providers configured';
  } else if (hasOpenAI || hasAnthropic) {
    result.checks.aiProviders.status = 'warn';
    result.checks.aiProviders.message = `Only ${hasOpenAI ? 'OpenAI' : 'Anthropic'} configured`;
    if (result.status === 'healthy') {
      result.status = 'degraded';
    }
  } else {
    result.checks.aiProviders.status = 'warn';
    result.checks.aiProviders.message = 'No AI providers configured (development mode)';
    // Don't mark as unhealthy - may be running locally without API keys
  }

  // Check 3: Required Environment Variables (MVP minimal set)
  const requiredEnvVars: string[] = [];
  // For MVP, we don't require any specific env vars
  // Production would require: OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    result.checks.environment.status = 'fail';
    result.checks.environment.missing = missingVars;
    result.status = 'unhealthy';
  }

  // Check 4: Memory Usage (if available)
  if (typeof process !== 'undefined' && process.memoryUsage) {
    try {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100);

      result.checks.memory = {
        status: percentUsed > 90 ? 'warn' : 'pass',
        heapUsedMB,
        heapTotalMB,
        percentUsed,
      };

      if (percentUsed > 90 && result.status === 'healthy') {
        result.status = 'degraded';
      }
    } catch {
      // Memory check not available
    }
  }

  // Final response time
  result.checks.api.responseTimeMs = Date.now() - startTime;

  // Determine HTTP status code
  const httpStatus = result.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(result, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Status': result.status,
    },
  });
}

// ================================================================
// HEAD (for lightweight health checks)
// ================================================================

export async function HEAD() {
  // Quick check - just return 200 if server is responding
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'responding',
    },
  });
}
