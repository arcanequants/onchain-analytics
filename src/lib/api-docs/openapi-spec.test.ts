/**
 * OpenAPI Specification Tests
 *
 * Phase 2, Week 8, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  openApiSpec,
  getOpenApiSpecJson,
  getApiVersion,
  getEndpoints,
  isValidPath,
} from './openapi-spec';

// ================================================================
// SPEC STRUCTURE TESTS
// ================================================================

describe('OpenAPI Spec Structure', () => {
  it('should have valid OpenAPI version', () => {
    expect(openApiSpec.openapi).toBe('3.0.3');
  });

  it('should have info object', () => {
    expect(openApiSpec.info).toBeDefined();
    expect(openApiSpec.info.title).toBe('AI Perception API');
    expect(openApiSpec.info.version).toBe('1.0.0');
  });

  it('should have description', () => {
    expect(openApiSpec.info.description).toBeDefined();
    expect(openApiSpec.info.description?.length).toBeGreaterThan(100);
  });

  it('should have contact info', () => {
    expect(openApiSpec.info.contact).toBeDefined();
    expect(openApiSpec.info.contact?.email).toBeDefined();
  });

  it('should have license', () => {
    expect(openApiSpec.info.license).toBeDefined();
    expect(openApiSpec.info.license?.name).toBe('MIT');
  });
});

// ================================================================
// SERVERS TESTS
// ================================================================

describe('OpenAPI Servers', () => {
  it('should have servers defined', () => {
    expect(openApiSpec.servers).toBeDefined();
    expect(openApiSpec.servers?.length).toBeGreaterThan(0);
  });

  it('should have production server', () => {
    const prodServer = openApiSpec.servers?.find((s) =>
      s.url.includes('api.aiperception.com')
    );
    expect(prodServer).toBeDefined();
    expect(prodServer?.description).toContain('Production');
  });

  it('should have staging server', () => {
    const stagingServer = openApiSpec.servers?.find((s) =>
      s.url.includes('staging')
    );
    expect(stagingServer).toBeDefined();
  });

  it('should have localhost for development', () => {
    const localServer = openApiSpec.servers?.find((s) =>
      s.url.includes('localhost')
    );
    expect(localServer).toBeDefined();
  });
});

// ================================================================
// SECURITY TESTS
// ================================================================

describe('OpenAPI Security', () => {
  it('should have security schemes', () => {
    expect(openApiSpec.components?.securitySchemes).toBeDefined();
  });

  it('should have bearer auth scheme', () => {
    const bearerAuth = openApiSpec.components?.securitySchemes?.bearerAuth;
    expect(bearerAuth).toBeDefined();
  });

  it('should have global security requirement', () => {
    expect(openApiSpec.security).toBeDefined();
    expect(openApiSpec.security?.length).toBeGreaterThan(0);
  });
});

// ================================================================
// TAGS TESTS
// ================================================================

describe('OpenAPI Tags', () => {
  it('should have tags defined', () => {
    expect(openApiSpec.tags).toBeDefined();
    expect(openApiSpec.tags?.length).toBeGreaterThan(0);
  });

  it('should have Scores tag', () => {
    const scoresTag = openApiSpec.tags?.find((t) => t.name === 'Scores');
    expect(scoresTag).toBeDefined();
  });

  it('should have Brands tag', () => {
    const brandsTag = openApiSpec.tags?.find((t) => t.name === 'Brands');
    expect(brandsTag).toBeDefined();
  });

  it('should have Leaderboards tag', () => {
    const leaderboardsTag = openApiSpec.tags?.find((t) => t.name === 'Leaderboards');
    expect(leaderboardsTag).toBeDefined();
  });

  it('should have Webhooks tag', () => {
    const webhooksTag = openApiSpec.tags?.find((t) => t.name === 'Webhooks');
    expect(webhooksTag).toBeDefined();
  });

  it('should have API Keys tag', () => {
    const apiKeysTag = openApiSpec.tags?.find((t) => t.name === 'API Keys');
    expect(apiKeysTag).toBeDefined();
  });
});

// ================================================================
// PATHS TESTS
// ================================================================

describe('OpenAPI Paths', () => {
  it('should have paths defined', () => {
    expect(openApiSpec.paths).toBeDefined();
    expect(Object.keys(openApiSpec.paths || {}).length).toBeGreaterThan(0);
  });

  it('should have /scores endpoint', () => {
    expect(openApiSpec.paths?.['/scores']).toBeDefined();
  });

  it('should have /brands endpoint', () => {
    expect(openApiSpec.paths?.['/brands']).toBeDefined();
  });

  it('should have /leaderboards endpoint', () => {
    expect(openApiSpec.paths?.['/leaderboards']).toBeDefined();
  });

  it('should have /webhooks endpoint', () => {
    expect(openApiSpec.paths?.['/webhooks']).toBeDefined();
  });

  it('should have /api-keys endpoint', () => {
    expect(openApiSpec.paths?.['/api-keys']).toBeDefined();
  });
});

// ================================================================
// SCORES ENDPOINT TESTS
// ================================================================

describe('Scores Endpoint', () => {
  const scoresPath = openApiSpec.paths?.['/scores'];

  it('should support POST method', () => {
    expect(scoresPath?.post).toBeDefined();
  });

  it('should support GET method', () => {
    expect(scoresPath?.get).toBeDefined();
  });

  it('should have operationId for POST', () => {
    expect(scoresPath?.post?.operationId).toBe('calculateScore');
  });

  it('should have operationId for GET', () => {
    expect(scoresPath?.get?.operationId).toBe('listScores');
  });

  it('should require authentication', () => {
    expect(scoresPath?.post?.security).toBeDefined();
  });

  it('should have request body for POST', () => {
    expect(scoresPath?.post?.requestBody).toBeDefined();
  });

  it('should have pagination parameters for GET', () => {
    const params = scoresPath?.get?.parameters;
    expect(params?.some((p: any) => p.name === 'page')).toBe(true);
    expect(params?.some((p: any) => p.name === 'limit')).toBe(true);
  });
});

// ================================================================
// BRANDS ENDPOINT TESTS
// ================================================================

describe('Brands Endpoint', () => {
  const brandsPath = openApiSpec.paths?.['/brands'];

  it('should support GET method', () => {
    expect(brandsPath?.get).toBeDefined();
  });

  it('should support POST method', () => {
    expect(brandsPath?.post).toBeDefined();
  });

  it('should have search parameter', () => {
    const params = brandsPath?.get?.parameters;
    expect(params?.some((p: any) => p.name === 'search')).toBe(true);
  });
});

// ================================================================
// LEADERBOARDS ENDPOINT TESTS
// ================================================================

describe('Leaderboards Endpoint', () => {
  const leaderboardsPath = openApiSpec.paths?.['/leaderboards'];

  it('should support GET method', () => {
    expect(leaderboardsPath?.get).toBeDefined();
  });

  it('should have category filter', () => {
    const params = leaderboardsPath?.get?.parameters;
    expect(params?.some((p: any) => p.name === 'category')).toBe(true);
  });

  it('should have period filter', () => {
    const params = leaderboardsPath?.get?.parameters;
    expect(params?.some((p: any) => p.name === 'period')).toBe(true);
  });
});

// ================================================================
// WEBHOOKS ENDPOINT TESTS
// ================================================================

describe('Webhooks Endpoint', () => {
  const webhooksPath = openApiSpec.paths?.['/webhooks'];

  it('should support GET method', () => {
    expect(webhooksPath?.get).toBeDefined();
  });

  it('should support POST method', () => {
    expect(webhooksPath?.post).toBeDefined();
  });

  it('should have test endpoint', () => {
    expect(openApiSpec.paths?.['/webhooks/{webhookId}/test']).toBeDefined();
  });

  it('should have delete endpoint', () => {
    expect(openApiSpec.paths?.['/webhooks/{webhookId}']?.delete).toBeDefined();
  });
});

// ================================================================
// API KEYS ENDPOINT TESTS
// ================================================================

describe('API Keys Endpoint', () => {
  const apiKeysPath = openApiSpec.paths?.['/api-keys'];

  it('should support GET method', () => {
    expect(apiKeysPath?.get).toBeDefined();
  });

  it('should support POST method', () => {
    expect(apiKeysPath?.post).toBeDefined();
  });

  it('should have revoke endpoint', () => {
    expect(openApiSpec.paths?.['/api-keys/{keyId}']?.delete).toBeDefined();
  });
});

// ================================================================
// SCHEMAS TESTS
// ================================================================

describe('OpenAPI Schemas', () => {
  const schemas = openApiSpec.components?.schemas;

  it('should have schemas defined', () => {
    expect(schemas).toBeDefined();
  });

  it('should have Error schema', () => {
    expect(schemas?.Error).toBeDefined();
  });

  it('should have Meta schema', () => {
    expect(schemas?.Meta).toBeDefined();
  });

  it('should have Pagination schema', () => {
    expect(schemas?.Pagination).toBeDefined();
  });

  it('should have Brand schema', () => {
    expect(schemas?.Brand).toBeDefined();
  });

  it('should have Score schema', () => {
    expect(schemas?.Score).toBeDefined();
  });

  it('should have Webhook schema', () => {
    expect(schemas?.Webhook).toBeDefined();
  });

  it('should have ApiKey schema', () => {
    expect(schemas?.ApiKey).toBeDefined();
  });
});

// ================================================================
// ERROR SCHEMA TESTS
// ================================================================

describe('Error Schema', () => {
  const errorSchema = openApiSpec.components?.schemas?.Error as any;

  it('should have required fields', () => {
    expect(errorSchema?.required).toContain('success');
    expect(errorSchema?.required).toContain('error');
  });

  it('should have success property', () => {
    expect(errorSchema?.properties?.success).toBeDefined();
  });

  it('should have error object', () => {
    expect(errorSchema?.properties?.error).toBeDefined();
  });
});

// ================================================================
// SCORE SCHEMA TESTS
// ================================================================

describe('Score Schema', () => {
  const scoreSchema = openApiSpec.components?.schemas?.Score as any;

  it('should have required fields', () => {
    expect(scoreSchema?.required).toContain('brandId');
    expect(scoreSchema?.required).toContain('overallScore');
  });

  it('should have overallScore with min/max', () => {
    expect(scoreSchema?.properties?.overallScore?.minimum).toBe(0);
    expect(scoreSchema?.properties?.overallScore?.maximum).toBe(100);
  });

  it('should have categories property', () => {
    expect(scoreSchema?.properties?.categories).toBeDefined();
  });

  it('should have providers array', () => {
    expect(scoreSchema?.properties?.providers?.type).toBe('array');
  });
});

// ================================================================
// UTILITY FUNCTION TESTS
// ================================================================

describe('getOpenApiSpecJson', () => {
  it('should return valid JSON string', () => {
    const json = getOpenApiSpecJson();
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should include all properties', () => {
    const json = getOpenApiSpecJson();
    const parsed = JSON.parse(json);
    expect(parsed.openapi).toBeDefined();
    expect(parsed.info).toBeDefined();
    expect(parsed.paths).toBeDefined();
  });
});

describe('getApiVersion', () => {
  it('should return version string', () => {
    const version = getApiVersion();
    expect(version).toBe('1.0.0');
  });
});

describe('getEndpoints', () => {
  it('should return array of endpoints', () => {
    const endpoints = getEndpoints();
    expect(Array.isArray(endpoints)).toBe(true);
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it('should include method, path, and summary', () => {
    const endpoints = getEndpoints();
    const first = endpoints[0];
    expect(first.method).toBeDefined();
    expect(first.path).toBeDefined();
    expect(first.summary).toBeDefined();
  });

  it('should include POST /scores endpoint', () => {
    const endpoints = getEndpoints();
    const postScores = endpoints.find(
      (e) => e.method === 'POST' && e.path === '/scores'
    );
    expect(postScores).toBeDefined();
  });

  it('should have uppercase methods', () => {
    const endpoints = getEndpoints();
    expect(endpoints.every((e) => e.method === e.method.toUpperCase())).toBe(true);
  });
});

describe('isValidPath', () => {
  it('should return true for valid paths', () => {
    expect(isValidPath('/scores', 'post')).toBe(true);
    expect(isValidPath('/scores', 'get')).toBe(true);
    expect(isValidPath('/brands', 'get')).toBe(true);
  });

  it('should return false for invalid paths', () => {
    expect(isValidPath('/invalid', 'get')).toBe(false);
  });

  it('should return false for invalid methods', () => {
    expect(isValidPath('/scores', 'delete')).toBe(false);
  });

  it('should be case insensitive for method', () => {
    expect(isValidPath('/scores', 'POST')).toBe(true);
    expect(isValidPath('/scores', 'Post')).toBe(true);
  });
});

// ================================================================
// RESPONSE FORMAT TESTS
// ================================================================

describe('Response Formats', () => {
  it('should have 200 response for GET endpoints', () => {
    const scoresGet = openApiSpec.paths?.['/scores']?.get;
    expect(scoresGet?.responses?.['200']).toBeDefined();
  });

  it('should have 201 response for POST endpoints', () => {
    const brandsPost = openApiSpec.paths?.['/brands']?.post;
    expect(brandsPost?.responses?.['201']).toBeDefined();
  });

  it('should have 400 response for validation errors', () => {
    const scoresPost = openApiSpec.paths?.['/scores']?.post;
    expect(scoresPost?.responses?.['400']).toBeDefined();
  });

  it('should have 401 response for auth errors', () => {
    const scoresPost = openApiSpec.paths?.['/scores']?.post;
    expect(scoresPost?.responses?.['401']).toBeDefined();
  });

  it('should have 429 response for rate limiting', () => {
    const scoresPost = openApiSpec.paths?.['/scores']?.post;
    expect(scoresPost?.responses?.['429']).toBeDefined();
  });
});
