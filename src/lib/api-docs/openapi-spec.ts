/**
 * OpenAPI Specification
 *
 * Complete API documentation for AI Perception platform
 *
 * Phase 2, Week 8, Day 1
 */

import type { OpenAPIV3 } from 'openapi-types';

// ================================================================
// API INFO
// ================================================================

const info: OpenAPIV3.InfoObject = {
  title: 'AI Perception API',
  version: '1.0.0',
  description: `
# AI Perception API

The AI Perception API allows you to analyze how AI systems perceive brands across different dimensions.

## Authentication

All API requests require authentication using an API key. Include your API key in the request headers:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Rate Limits

- Free tier: 100 requests/day
- Pro tier: 1,000 requests/day
- Enterprise tier: Custom limits

## Response Format

All responses are in JSON format and include standard fields:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

## Error Handling

Errors follow a consistent format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid brand name",
    "details": { ... }
  }
}
\`\`\`
  `,
  contact: {
    name: 'API Support',
    email: 'api@aiperception.com',
    url: 'https://aiperception.com/support',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
};

// ================================================================
// SERVERS
// ================================================================

const servers: OpenAPIV3.ServerObject[] = [
  {
    url: 'https://api.aiperception.com/v1',
    description: 'Production server',
  },
  {
    url: 'https://staging-api.aiperception.com/v1',
    description: 'Staging server',
  },
  {
    url: 'http://localhost:3000/api/v1',
    description: 'Local development',
  },
];

// ================================================================
// SECURITY SCHEMES
// ================================================================

const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'API Key',
    description: 'API key authentication',
  },
  apiKeyHeader: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API key in header',
  },
};

// ================================================================
// COMMON SCHEMAS
// ================================================================

const commonSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Error: {
    type: 'object',
    required: ['success', 'error'],
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          message: {
            type: 'string',
            example: 'Invalid request parameters',
          },
          details: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
  },
  Meta: {
    type: 'object',
    properties: {
      requestId: {
        type: 'string',
        example: 'req_abc123xyz',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00Z',
      },
      rateLimit: {
        type: 'object',
        properties: {
          limit: { type: 'integer', example: 1000 },
          remaining: { type: 'integer', example: 950 },
          reset: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 150 },
      totalPages: { type: 'integer', example: 8 },
      hasNext: { type: 'boolean', example: true },
      hasPrev: { type: 'boolean', example: false },
    },
  },
};

// ================================================================
// BRAND SCHEMAS
// ================================================================

const brandSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Brand: {
    type: 'object',
    required: ['id', 'name', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        example: 'brand_abc123',
      },
      name: {
        type: 'string',
        example: 'Acme Corp',
      },
      description: {
        type: 'string',
        example: 'Leading provider of innovative solutions',
      },
      industry: {
        type: 'string',
        example: 'technology',
      },
      website: {
        type: 'string',
        format: 'uri',
        example: 'https://acme.com',
      },
      logo: {
        type: 'string',
        format: 'uri',
        example: 'https://acme.com/logo.png',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  BrandCreate: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Acme Corp',
      },
      description: {
        type: 'string',
        maxLength: 500,
      },
      industry: {
        type: 'string',
        enum: [
          'technology',
          'finance',
          'healthcare',
          'retail',
          'manufacturing',
          'education',
          'entertainment',
          'other',
        ],
      },
      website: {
        type: 'string',
        format: 'uri',
      },
    },
  },
};

// ================================================================
// SCORE SCHEMAS
// ================================================================

const scoreSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Score: {
    type: 'object',
    required: ['brandId', 'overallScore', 'categories', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        example: 'score_xyz789',
      },
      brandId: {
        type: 'string',
        example: 'brand_abc123',
      },
      overallScore: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        example: 85,
      },
      grade: {
        type: 'string',
        enum: ['excellent', 'good', 'average', 'poor', 'critical'],
        example: 'good',
      },
      categories: {
        type: 'object',
        properties: {
          recognition: {
            $ref: '#/components/schemas/CategoryScore',
          },
          sentiment: {
            $ref: '#/components/schemas/CategoryScore',
          },
          accuracy: {
            $ref: '#/components/schemas/CategoryScore',
          },
          prominence: {
            $ref: '#/components/schemas/CategoryScore',
          },
          recommendations: {
            $ref: '#/components/schemas/CategoryScore',
          },
          consistency: {
            $ref: '#/components/schemas/CategoryScore',
          },
        },
      },
      providers: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ProviderScore',
        },
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  CategoryScore: {
    type: 'object',
    properties: {
      score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        example: 88,
      },
      weight: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        example: 0.2,
      },
      details: {
        type: 'string',
        example: 'Brand is well recognized across AI platforms',
      },
    },
  },
  ProviderScore: {
    type: 'object',
    properties: {
      provider: {
        type: 'string',
        enum: ['openai', 'anthropic', 'google', 'perplexity'],
        example: 'openai',
      },
      score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        example: 90,
      },
      response: {
        type: 'string',
        example: 'Acme Corp is a leading technology company...',
      },
    },
  },
  ScoreRequest: {
    type: 'object',
    required: ['brandName'],
    properties: {
      brandName: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Acme Corp',
      },
      industry: {
        type: 'string',
        example: 'technology',
      },
      providers: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['openai', 'anthropic', 'google', 'perplexity'],
        },
        default: ['openai', 'anthropic'],
      },
      includeDetails: {
        type: 'boolean',
        default: true,
      },
    },
  },
};

// ================================================================
// LEADERBOARD SCHEMAS
// ================================================================

const leaderboardSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  LeaderboardEntry: {
    type: 'object',
    properties: {
      rank: {
        type: 'integer',
        example: 1,
      },
      brandId: {
        type: 'string',
        example: 'brand_abc123',
      },
      brandName: {
        type: 'string',
        example: 'Acme Corp',
      },
      score: {
        type: 'number',
        example: 95,
      },
      trend: {
        type: 'string',
        enum: ['up', 'down', 'stable', 'new'],
        example: 'up',
      },
      scoreChange: {
        type: 'number',
        example: 3,
      },
      category: {
        type: 'string',
        example: 'technology',
      },
      isVerified: {
        type: 'boolean',
        example: true,
      },
    },
  },
  Leaderboard: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        example: 'all',
      },
      period: {
        type: 'string',
        enum: ['daily', 'weekly', 'monthly', 'all-time'],
        example: 'weekly',
      },
      entries: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LeaderboardEntry',
        },
      },
      totalEntries: {
        type: 'integer',
        example: 150,
      },
      lastUpdated: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
};

// ================================================================
// WEBHOOK SCHEMAS
// ================================================================

const webhookSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Webhook: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        example: 'wh_abc123',
      },
      url: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/webhooks/aiperception',
      },
      events: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'score.created',
            'score.updated',
            'brand.created',
            'brand.updated',
            'alert.triggered',
          ],
        },
      },
      secret: {
        type: 'string',
        example: 'whsec_...',
      },
      isActive: {
        type: 'boolean',
        example: true,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  WebhookCreate: {
    type: 'object',
    required: ['url', 'events'],
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/webhooks',
      },
      events: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'score.created',
            'score.updated',
            'brand.created',
            'brand.updated',
            'alert.triggered',
          ],
        },
        minItems: 1,
      },
    },
  },
  WebhookEvent: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        example: 'evt_xyz789',
      },
      type: {
        type: 'string',
        example: 'score.created',
      },
      data: {
        type: 'object',
        additionalProperties: true,
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
};

// ================================================================
// API KEY SCHEMAS
// ================================================================

const apiKeySchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ApiKey: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        example: 'key_abc123',
      },
      name: {
        type: 'string',
        example: 'Production API Key',
      },
      prefix: {
        type: 'string',
        example: 'aip_live_',
      },
      lastUsed: {
        type: 'string',
        format: 'date-time',
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
      },
      permissions: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['read:scores', 'write:scores', 'read:brands', 'write:brands', 'admin'],
        },
      },
      rateLimit: {
        type: 'integer',
        example: 1000,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  ApiKeyCreate: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        example: 'Production API Key',
      },
      permissions: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['read:scores', 'write:scores', 'read:brands', 'write:brands'],
        },
        default: ['read:scores', 'read:brands'],
      },
      expiresInDays: {
        type: 'integer',
        minimum: 1,
        maximum: 365,
        example: 90,
      },
    },
  },
  ApiKeyCreated: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        example: 'key_abc123',
      },
      key: {
        type: 'string',
        description: 'Full API key - only shown once',
        example: 'aip_live_abc123xyz789...',
      },
      name: {
        type: 'string',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
};

// ================================================================
// PATHS - SCORES
// ================================================================

const scorePaths: OpenAPIV3.PathsObject = {
  '/scores': {
    post: {
      tags: ['Scores'],
      summary: 'Calculate brand score',
      description: 'Calculate AI perception score for a brand using multiple AI providers',
      operationId: 'calculateScore',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ScoreRequest',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Score calculated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Score' },
                  meta: { $ref: '#/components/schemas/Meta' },
                },
              },
            },
          },
        },
        '400': {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        '429': {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    get: {
      tags: ['Scores'],
      summary: 'List scores',
      description: 'Get a list of calculated scores with pagination',
      operationId: 'listScores',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'brandId',
          in: 'query',
          description: 'Filter by brand ID',
          schema: { type: 'string' },
        },
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: { type: 'integer', default: 20, maximum: 100 },
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Sort field',
          schema: {
            type: 'string',
            enum: ['createdAt', 'overallScore'],
            default: 'createdAt',
          },
        },
        {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc',
          },
        },
      ],
      responses: {
        '200': {
          description: 'Scores retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Score' },
                  },
                  meta: { $ref: '#/components/schemas/Meta' },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/scores/{scoreId}': {
    get: {
      tags: ['Scores'],
      summary: 'Get score by ID',
      description: 'Retrieve a specific score by its ID',
      operationId: 'getScore',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'scoreId',
          in: 'path',
          required: true,
          description: 'Score ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Score retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Score' },
                  meta: { $ref: '#/components/schemas/Meta' },
                },
              },
            },
          },
        },
        '404': {
          description: 'Score not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
  },
};

// ================================================================
// PATHS - BRANDS
// ================================================================

const brandPaths: OpenAPIV3.PathsObject = {
  '/brands': {
    get: {
      tags: ['Brands'],
      summary: 'List brands',
      description: 'Get a list of brands with pagination',
      operationId: 'listBrands',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'search',
          in: 'query',
          description: 'Search by brand name',
          schema: { type: 'string' },
        },
        {
          name: 'industry',
          in: 'query',
          description: 'Filter by industry',
          schema: { type: 'string' },
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
        },
      ],
      responses: {
        '200': {
          description: 'Brands retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Brand' },
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Brands'],
      summary: 'Create brand',
      description: 'Create a new brand',
      operationId: 'createBrand',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BrandCreate' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Brand created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Brand' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/brands/{brandId}': {
    get: {
      tags: ['Brands'],
      summary: 'Get brand by ID',
      operationId: 'getBrand',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'brandId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Brand retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Brand' },
                },
              },
            },
          },
        },
      },
    },
  },
};

// ================================================================
// PATHS - LEADERBOARDS
// ================================================================

const leaderboardPaths: OpenAPIV3.PathsObject = {
  '/leaderboards': {
    get: {
      tags: ['Leaderboards'],
      summary: 'Get leaderboard',
      description: 'Get brand rankings with filters',
      operationId: 'getLeaderboard',
      parameters: [
        {
          name: 'category',
          in: 'query',
          description: 'Filter by industry category',
          schema: { type: 'string', default: 'all' },
        },
        {
          name: 'period',
          in: 'query',
          description: 'Time period',
          schema: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly', 'all-time'],
            default: 'weekly',
          },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50, maximum: 100 },
        },
        {
          name: 'offset',
          in: 'query',
          schema: { type: 'integer', default: 0 },
        },
      ],
      responses: {
        '200': {
          description: 'Leaderboard retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Leaderboard' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/leaderboards/stats': {
    get: {
      tags: ['Leaderboards'],
      summary: 'Get leaderboard statistics',
      operationId: 'getLeaderboardStats',
      parameters: [
        {
          name: 'category',
          in: 'query',
          schema: { type: 'string', default: 'all' },
        },
      ],
      responses: {
        '200': {
          description: 'Statistics retrieved successfully',
        },
      },
    },
  },
};

// ================================================================
// PATHS - WEBHOOKS
// ================================================================

const webhookPaths: OpenAPIV3.PathsObject = {
  '/webhooks': {
    get: {
      tags: ['Webhooks'],
      summary: 'List webhooks',
      operationId: 'listWebhooks',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Webhooks retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Webhook' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Webhooks'],
      summary: 'Create webhook',
      operationId: 'createWebhook',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/WebhookCreate' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Webhook created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Webhook' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/webhooks/{webhookId}': {
    delete: {
      tags: ['Webhooks'],
      summary: 'Delete webhook',
      operationId: 'deleteWebhook',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'webhookId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': {
          description: 'Webhook deleted successfully',
        },
      },
    },
  },
  '/webhooks/{webhookId}/test': {
    post: {
      tags: ['Webhooks'],
      summary: 'Test webhook',
      description: 'Send a test event to the webhook endpoint',
      operationId: 'testWebhook',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'webhookId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Test event sent successfully',
        },
      },
    },
  },
};

// ================================================================
// PATHS - API KEYS
// ================================================================

const apiKeyPaths: OpenAPIV3.PathsObject = {
  '/api-keys': {
    get: {
      tags: ['API Keys'],
      summary: 'List API keys',
      operationId: 'listApiKeys',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'API keys retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ApiKey' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['API Keys'],
      summary: 'Create API key',
      operationId: 'createApiKey',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiKeyCreate' },
          },
        },
      },
      responses: {
        '201': {
          description: 'API key created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/ApiKeyCreated' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api-keys/{keyId}': {
    delete: {
      tags: ['API Keys'],
      summary: 'Revoke API key',
      operationId: 'revokeApiKey',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'keyId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': {
          description: 'API key revoked successfully',
        },
      },
    },
  },
};

// ================================================================
// COMPLETE SPEC
// ================================================================

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info,
  servers,
  tags: [
    { name: 'Scores', description: 'AI perception score operations' },
    { name: 'Brands', description: 'Brand management' },
    { name: 'Leaderboards', description: 'Public rankings' },
    { name: 'Webhooks', description: 'Webhook management' },
    { name: 'API Keys', description: 'API key management' },
  ],
  paths: {
    ...scorePaths,
    ...brandPaths,
    ...leaderboardPaths,
    ...webhookPaths,
    ...apiKeyPaths,
  },
  components: {
    securitySchemes,
    schemas: {
      ...commonSchemas,
      ...brandSchemas,
      ...scoreSchemas,
      ...leaderboardSchemas,
      ...webhookSchemas,
      ...apiKeySchemas,
    },
  },
  security: [{ bearerAuth: [] }],
};

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get OpenAPI spec as JSON string
 */
export function getOpenApiSpecJson(): string {
  return JSON.stringify(openApiSpec, null, 2);
}

/**
 * Get OpenAPI spec version
 */
export function getApiVersion(): string {
  return openApiSpec.info.version;
}

/**
 * Get list of available endpoints
 */
export function getEndpoints(): { method: string; path: string; summary: string }[] {
  const endpoints: { method: string; path: string; summary: string }[] = [];

  for (const [path, pathItem] of Object.entries(openApiSpec.paths || {})) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (operation) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: operation.summary || '',
        });
      }
    }
  }

  return endpoints;
}

/**
 * Validate if a path exists in the spec
 */
export function isValidPath(path: string, method: string): boolean {
  const pathItem = openApiSpec.paths?.[path];
  if (!pathItem) return false;

  return method.toLowerCase() in pathItem;
}

export default openApiSpec;
