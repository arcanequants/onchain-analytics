/**
 * OpenAPI 3.1 Specification Generator
 *
 * Automatically generates OpenAPI spec from Zod schemas
 * Phase 4, Week 8 - Backend Engineering Checklist
 *
 * Uses zod-to-openapi for conversion
 */

import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI metadata support
extendZodWithOpenApi(z);

// Import all schemas
import {
  AnalysisRequestSchema,
  AnalysisStatusSchema,
  FullAnalysisResponseSchema,
  IndustryDetectionSchema,
  PerceptionQuerySchema,
  BrandMentionsResponseSchema,
  RecommendationsResponseSchema,
  SentimentAnalysisSchema,
  HallucinationCheckSchema,
  AIProviderSchema,
  PerceptionScoreSchema,
  ConfidenceScoreSchema,
} from '@/lib/ai/schemas';

// ================================================================
// REGISTRY SETUP
// ================================================================

const registry = new OpenAPIRegistry();

// ================================================================
// SCHEMA REGISTRATION WITH OPENAPI METADATA
// ================================================================

// Common schemas
const ConfidenceScore = registry.register(
  'ConfidenceScore',
  ConfidenceScoreSchema.openapi({
    description: 'Confidence score from 0 to 1',
    example: 0.85,
  })
);

const PerceptionScore = registry.register(
  'PerceptionScore',
  PerceptionScoreSchema.openapi({
    description: 'AI perception score from 0 to 100',
    example: 72,
  })
);

const AIProvider = registry.register(
  'AIProvider',
  AIProviderSchema.openapi({
    description: 'Supported AI provider identifiers',
    example: 'openai',
  })
);

// Request/Response schemas
const AnalysisRequest = registry.register(
  'AnalysisRequest',
  AnalysisRequestSchema.openapi({
    description: 'Request body for initiating a brand perception analysis',
    example: {
      url: 'https://example.com',
      industry: 'saas',
      forceRefresh: false,
      includeCompetitors: true,
      depth: 'standard',
    },
  })
);

const AnalysisStatus = registry.register(
  'AnalysisStatus',
  AnalysisStatusSchema.openapi({
    description: 'Current status of an analysis job',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'processing',
      progress: 45,
      currentStep: 'Querying OpenAI...',
      estimatedTimeRemaining: 15,
    },
  })
);

const IndustryDetection = registry.register(
  'IndustryDetection',
  IndustryDetectionSchema.openapi({
    description: 'Detected industry classification for a brand',
    example: {
      industry: 'saas',
      subIndustry: 'crm-sales-tools',
      country: 'US',
      entityType: 'business',
      competitors: ['Salesforce', 'HubSpot', 'Pipedrive'],
      confidence: 0.92,
      reasoning: 'Website metadata indicates CRM software targeting sales teams',
    },
  })
);

const BrandMentionsResponse = registry.register(
  'BrandMentionsResponse',
  BrandMentionsResponseSchema.openapi({
    description: 'Analysis of brand mentions in AI responses',
  })
);

const RecommendationsResponse = registry.register(
  'RecommendationsResponse',
  RecommendationsResponseSchema.openapi({
    description: 'Actionable recommendations to improve AI visibility',
  })
);

const SentimentAnalysis = registry.register(
  'SentimentAnalysis',
  SentimentAnalysisSchema.openapi({
    description: 'Detailed sentiment analysis of brand perception',
  })
);

const HallucinationCheck = registry.register(
  'HallucinationCheck',
  HallucinationCheckSchema.openapi({
    description: 'Verification result for AI-generated claims',
  })
);

const FullAnalysisResponse = registry.register(
  'FullAnalysisResponse',
  FullAnalysisResponseSchema.openapi({
    description: 'Complete analysis response with all components',
  })
);

// Error response schema
const ErrorResponseSchema = z.object({
  error: z.string().describe('Error message'),
  code: z.string().describe('Error code for programmatic handling'),
  details: z.record(z.string(), z.unknown()).optional().describe('Additional error details'),
  requestId: z.string().uuid().optional().describe('Request ID for support'),
});

const ErrorResponse = registry.register(
  'ErrorResponse',
  ErrorResponseSchema.openapi({
    description: 'Standard error response format (RFC 7807 Problem Details)',
    example: {
      error: 'Invalid URL provided',
      code: 'VALIDATION_ERROR',
      details: { field: 'url', reason: 'URL is not reachable' },
      requestId: '550e8400-e29b-41d4-a716-446655440000',
    },
  })
);

// Health check schema
const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  version: z.string(),
  timestamp: z.string().datetime(),
  services: z.object({
    database: z.object({
      status: z.enum(['up', 'down', 'degraded']),
      latencyMs: z.number().optional(),
    }),
    cache: z.object({
      status: z.enum(['up', 'down', 'degraded']),
      latencyMs: z.number().optional(),
    }),
    openai: z.object({
      status: z.enum(['up', 'down', 'degraded']),
      latencyMs: z.number().optional(),
    }),
    anthropic: z.object({
      status: z.enum(['up', 'down', 'degraded']),
      latencyMs: z.number().optional(),
    }),
  }),
});

const HealthCheck = registry.register(
  'HealthCheck',
  HealthCheckSchema.openapi({
    description: 'Health check response showing service status',
    example: {
      status: 'healthy',
      version: '1.0.0',
      timestamp: '2025-01-30T12:00:00Z',
      services: {
        database: { status: 'up', latencyMs: 5 },
        cache: { status: 'up', latencyMs: 2 },
        openai: { status: 'up', latencyMs: 150 },
        anthropic: { status: 'up', latencyMs: 180 },
      },
    },
  })
);

// ================================================================
// API ENDPOINTS REGISTRATION
// ================================================================

// POST /api/analyze
registry.registerPath({
  method: 'post',
  path: '/api/analyze',
  summary: 'Start brand perception analysis',
  description: 'Initiates an AI perception analysis for the given URL. Returns an analysis ID to track progress.',
  tags: ['Analysis'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: AnalysisRequest,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Analysis started successfully',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            status: z.literal('pending'),
            estimatedTimeSeconds: z.number(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid request',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
    429: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }, {}], // Optional auth
});

// GET /api/analyze/{id}/status
registry.registerPath({
  method: 'get',
  path: '/api/analyze/{id}/status',
  summary: 'Get analysis status',
  description: 'Returns the current status and progress of an analysis job.',
  tags: ['Analysis'],
  request: {
    params: z.object({
      id: z.string().uuid().describe('Analysis ID'),
    }),
  },
  responses: {
    200: {
      description: 'Analysis status',
      content: {
        'application/json': {
          schema: AnalysisStatus,
        },
      },
    },
    404: {
      description: 'Analysis not found',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
  },
});

// GET /api/analyze/{id}
registry.registerPath({
  method: 'get',
  path: '/api/analyze/{id}',
  summary: 'Get analysis results',
  description: 'Returns the complete results of a finished analysis.',
  tags: ['Analysis'],
  request: {
    params: z.object({
      id: z.string().uuid().describe('Analysis ID'),
    }),
  },
  responses: {
    200: {
      description: 'Complete analysis results',
      content: {
        'application/json': {
          schema: FullAnalysisResponse,
        },
      },
    },
    202: {
      description: 'Analysis still in progress',
      content: {
        'application/json': {
          schema: AnalysisStatus,
        },
      },
    },
    404: {
      description: 'Analysis not found',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
  },
});

// GET /api/health
registry.registerPath({
  method: 'get',
  path: '/api/health',
  summary: 'Health check',
  description: 'Returns the health status of the API and its dependencies.',
  tags: ['System'],
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: HealthCheck,
        },
      },
    },
    503: {
      description: 'Service is unhealthy',
      content: {
        'application/json': {
          schema: HealthCheck,
        },
      },
    },
  },
});

// GET /api/health/deep
registry.registerPath({
  method: 'get',
  path: '/api/health/deep',
  summary: 'Deep health check',
  description: 'Performs comprehensive health checks on all dependencies including database queries and AI provider connectivity.',
  tags: ['System'],
  responses: {
    200: {
      description: 'All services healthy',
      content: {
        'application/json': {
          schema: HealthCheck,
        },
      },
    },
    503: {
      description: 'One or more services unhealthy',
      content: {
        'application/json': {
          schema: HealthCheck,
        },
      },
    },
  },
});

// POST /api/feedback
registry.registerPath({
  method: 'post',
  path: '/api/feedback',
  summary: 'Submit analysis feedback',
  description: 'Submit feedback on an analysis result (thumbs up/down, rating, comment).',
  tags: ['Feedback'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            analysisId: z.string().uuid(),
            feedbackType: z.enum(['score', 'recommendation', 'overall']),
            rating: z.number().int().min(1).max(5).optional(),
            isPositive: z.boolean().optional(),
            comment: z.string().max(1000).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Feedback submitted successfully',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid feedback',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// GET /api/user/analyses
registry.registerPath({
  method: 'get',
  path: '/api/user/analyses',
  summary: 'List user analyses',
  description: 'Returns paginated list of analyses for the authenticated user.',
  tags: ['User'],
  request: {
    query: z.object({
      page: z.number().int().min(1).default(1).optional(),
      limit: z.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of analyses',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({
              id: z.string().uuid(),
              url: z.string().url(),
              brandName: z.string(),
              status: z.enum(['pending', 'processing', 'completed', 'failed']),
              score: PerceptionScoreSchema.nullable(),
              createdAt: z.string().datetime(),
              completedAt: z.string().datetime().nullable(),
            })),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ================================================================
// GENERATOR
// ================================================================

const generator = new OpenApiGeneratorV31(registry.definitions);

export function generateOpenAPISpec() {
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'AI Perception API',
      version: '1.0.0',
      description: `
# AI Perception Engineering API

Analyze how AI models perceive your brand. This API allows you to:

- **Analyze URLs** to get AI perception scores
- **Track progress** of ongoing analyses
- **Get recommendations** to improve AI visibility
- **Submit feedback** to improve our models

## Authentication

Most endpoints require authentication via Bearer token (JWT).
Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

Some endpoints (like health checks and initial analysis) can be accessed without authentication.

## Rate Limits

| Plan | Requests/minute | Analyses/month |
|------|-----------------|----------------|
| Free | 10 | 5 |
| Starter | 30 | 50 |
| Pro | 60 | Unlimited |

## Error Handling

All errors follow RFC 7807 Problem Details format with consistent structure.
      `,
      contact: {
        name: 'AI Perception Support',
        email: 'support@aiperception.agency',
        url: 'https://aiperception.agency/support',
      },
      license: {
        name: 'Proprietary',
        url: 'https://aiperception.agency/terms',
      },
    },
    servers: [
      {
        url: 'https://aiperception.agency',
        description: 'Production server',
      },
      {
        url: 'https://staging.aiperception.agency',
        description: 'Staging server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development',
      },
    ],
    tags: [
      {
        name: 'Analysis',
        description: 'Brand perception analysis endpoints',
      },
      {
        name: 'User',
        description: 'User-specific endpoints',
      },
      {
        name: 'Feedback',
        description: 'Feedback and improvement endpoints',
      },
      {
        name: 'System',
        description: 'System health and status endpoints',
      },
    ],
    security: [{ bearerAuth: [] }],
    externalDocs: {
      description: 'Full Documentation',
      url: 'https://docs.aiperception.agency',
    },
  });
}

// ================================================================
// EXPORT UTILITIES
// ================================================================

export { registry };

export function getOpenAPISpecJSON(): string {
  return JSON.stringify(generateOpenAPISpec(), null, 2);
}

export function getOpenAPISpecYAML(): string {
  // Simple YAML conversion for basic types
  const spec = generateOpenAPISpec();
  return convertToYAML(spec);
}

function convertToYAML(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'string') {
    // Check if string needs quotes
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `|\n${obj.split('\n').map(line => spaces + '  ' + line).join('\n')}`;
    }
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const value = convertToYAML(item, indent + 1);
      if (typeof item === 'object' && item !== null) {
        return `\n${spaces}- ${value.trim()}`;
      }
      return `\n${spaces}- ${value}`;
    }).join('');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';

    return entries.map(([key, value]) => {
      const yamlValue = convertToYAML(value, indent + 1);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `\n${spaces}${key}:${yamlValue}`;
      }
      if (Array.isArray(value)) {
        return `\n${spaces}${key}:${yamlValue}`;
      }
      return `\n${spaces}${key}: ${yamlValue}`;
    }).join('');
  }

  return String(obj);
}
