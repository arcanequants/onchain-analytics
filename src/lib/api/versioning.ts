/**
 * API Versioning Module
 *
 * Phase 2, Week 3, Day 5
 * Handles API version negotiation, deprecation, and migration
 */

import { NextRequest, NextResponse } from 'next/server';

// ================================================================
// TYPES
// ================================================================

export type APIVersion = 'v1' | 'v2' | 'v3';

export interface VersionInfo {
  version: APIVersion;
  status: 'current' | 'deprecated' | 'sunset';
  sunsetDate?: string;
  migrationGuide?: string;
  releaseDate: string;
  features: string[];
}

export interface VersionedResponse<T> {
  data: T;
  meta: {
    apiVersion: APIVersion;
    deprecationNotice?: string;
    sunsetDate?: string;
    upgradeUrl?: string;
  };
}

export interface APIVersionConfig {
  currentVersion: APIVersion;
  supportedVersions: APIVersion[];
  defaultVersion: APIVersion;
  versionHeader: string;
  acceptHeader: string;
}

// ================================================================
// VERSION REGISTRY
// ================================================================

const VERSION_REGISTRY: Record<APIVersion, VersionInfo> = {
  v1: {
    version: 'v1',
    status: 'current',
    releaseDate: '2025-12-01',
    features: [
      'analyze',
      'results',
      'recommendations',
      'competitors',
      'health',
    ],
  },
  v2: {
    version: 'v2',
    status: 'current',
    releaseDate: '2025-12-01',
    features: [
      'analyze',
      'results',
      'recommendations',
      'competitors',
      'health',
      'batch-analyze',
      'webhooks',
      'streaming',
    ],
  },
  v3: {
    version: 'v3',
    status: 'current',
    releaseDate: '2025-12-01',
    features: [
      'analyze',
      'results',
      'recommendations',
      'competitors',
      'health',
      'batch-analyze',
      'webhooks',
      'streaming',
      'knowledge-graph',
      'real-time-monitoring',
    ],
  },
};

// ================================================================
// CONFIGURATION
// ================================================================

const API_CONFIG: APIVersionConfig = {
  currentVersion: 'v1',
  supportedVersions: ['v1'],
  defaultVersion: 'v1',
  versionHeader: 'X-API-Version',
  acceptHeader: 'application/vnd.aiperception',
};

// ================================================================
// VERSION DETECTION
// ================================================================

/**
 * Extract API version from request headers or URL
 */
export function detectVersion(request: NextRequest): APIVersion {
  // 1. Check explicit version header
  const headerVersion = request.headers.get(API_CONFIG.versionHeader);
  if (headerVersion && isValidVersion(headerVersion)) {
    return headerVersion as APIVersion;
  }

  // 2. Check Accept header (application/vnd.aiperception.v1+json)
  const acceptHeader = request.headers.get('Accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/vnd\.aiperception\.v(\d+)/);
    if (versionMatch) {
      const version = `v${versionMatch[1]}` as APIVersion;
      if (isValidVersion(version)) {
        return version;
      }
    }
  }

  // 3. Check URL path for version (/api/v1/analyze)
  const pathMatch = request.nextUrl.pathname.match(/\/api\/(v\d+)\//);
  if (pathMatch && isValidVersion(pathMatch[1])) {
    return pathMatch[1] as APIVersion;
  }

  // 4. Default to current version
  return API_CONFIG.defaultVersion;
}

/**
 * Validate if a version string is supported
 */
export function isValidVersion(version: string): boolean {
  return API_CONFIG.supportedVersions.includes(version as APIVersion);
}

/**
 * Get version info
 */
export function getVersionInfo(version: APIVersion): VersionInfo | null {
  return VERSION_REGISTRY[version] || null;
}

// ================================================================
// VERSION HEADERS
// ================================================================

/**
 * Add version headers to response
 */
export function addVersionHeaders(
  response: NextResponse,
  version: APIVersion
): NextResponse {
  const versionInfo = VERSION_REGISTRY[version];

  response.headers.set(API_CONFIG.versionHeader, version);
  response.headers.set('X-API-Supported-Versions', API_CONFIG.supportedVersions.join(', '));
  response.headers.set('X-API-Current-Version', API_CONFIG.currentVersion);

  // Add deprecation headers if applicable
  if (versionInfo?.status === 'deprecated') {
    response.headers.set('Deprecation', 'true');
    if (versionInfo.sunsetDate) {
      response.headers.set('Sunset', versionInfo.sunsetDate);
    }
    if (versionInfo.migrationGuide) {
      response.headers.set('Link', `<${versionInfo.migrationGuide}>; rel="deprecation"`);
    }
  }

  return response;
}

// ================================================================
// VERSIONED RESPONSE HELPERS
// ================================================================

/**
 * Create a versioned JSON response
 */
export function versionedResponse<T>(
  data: T,
  version: APIVersion,
  status: number = 200
): NextResponse<VersionedResponse<T>> {
  const versionInfo = VERSION_REGISTRY[version];

  const responseBody: VersionedResponse<T> = {
    data,
    meta: {
      apiVersion: version,
    },
  };

  // Add deprecation notice if applicable
  if (versionInfo?.status === 'deprecated') {
    responseBody.meta.deprecationNotice =
      `API ${version} is deprecated and will be sunset on ${versionInfo.sunsetDate || 'TBD'}`;
    responseBody.meta.sunsetDate = versionInfo.sunsetDate;
    responseBody.meta.upgradeUrl = versionInfo.migrationGuide;
  }

  const response = NextResponse.json(responseBody, { status });
  return addVersionHeaders(response, version) as NextResponse<VersionedResponse<T>>;
}

/**
 * Create a versioned error response
 */
export function versionedError(
  error: string,
  code: string,
  version: APIVersion,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  const responseBody = {
    error: {
      message: error,
      code,
      details,
    },
    meta: {
      apiVersion: version,
    },
  };

  const response = NextResponse.json(responseBody, { status });
  return addVersionHeaders(response, version);
}

// ================================================================
// VERSION MIDDLEWARE
// ================================================================

/**
 * Version middleware for API routes
 */
export function withVersioning(
  handler: (
    request: NextRequest,
    version: APIVersion
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const version = detectVersion(request);

    // Check if version is supported
    if (!isValidVersion(version)) {
      return NextResponse.json(
        {
          error: {
            message: `API version ${version} is not supported`,
            code: 'UNSUPPORTED_VERSION',
            supportedVersions: API_CONFIG.supportedVersions,
          },
        },
        { status: 400 }
      );
    }

    // Check if version is sunset
    const versionInfo = VERSION_REGISTRY[version];
    if (versionInfo?.status === 'sunset') {
      return NextResponse.json(
        {
          error: {
            message: `API version ${version} has been sunset`,
            code: 'VERSION_SUNSET',
            sunsetDate: versionInfo.sunsetDate,
            migrationGuide: versionInfo.migrationGuide,
          },
        },
        { status: 410 }
      );
    }

    // Call handler with version
    const response = await handler(request, version);

    // Add version headers
    return addVersionHeaders(response, version);
  };
}

// ================================================================
// VERSION TRANSFORMERS
// ================================================================

/**
 * Transform response data based on API version
 * Useful for maintaining backward compatibility
 */
export type VersionTransformer<TInput, TOutput> = (
  data: TInput,
  version: APIVersion
) => TOutput;

/**
 * Create a version-aware transformer
 */
export function createVersionTransformer<TInput, TOutput>(
  transformers: Partial<Record<APIVersion, (data: TInput) => TOutput>>,
  defaultTransform: (data: TInput) => TOutput
): VersionTransformer<TInput, TOutput> {
  return (data: TInput, version: APIVersion): TOutput => {
    const transformer = transformers[version];
    if (transformer) {
      return transformer(data);
    }
    return defaultTransform(data);
  };
}

// ================================================================
// ROUTE BUILDER
// ================================================================

/**
 * Build versioned route handlers
 */
export class VersionedRouteBuilder {
  private handlers: Map<APIVersion, (request: NextRequest) => Promise<NextResponse>> = new Map();

  version(version: APIVersion, handler: (request: NextRequest) => Promise<NextResponse>): this {
    this.handlers.set(version, handler);
    return this;
  }

  build() {
    return async (request: NextRequest): Promise<NextResponse> => {
      const version = detectVersion(request);

      // Find handler for this version or fall back to closest older version
      const handler = this.handlers.get(version);
      if (handler) {
        const response = await handler(request);
        return addVersionHeaders(response, version);
      }

      // Fall back to default version handler
      const defaultHandler = this.handlers.get(API_CONFIG.defaultVersion);
      if (defaultHandler) {
        const response = await defaultHandler(request);
        return addVersionHeaders(response, API_CONFIG.defaultVersion);
      }

      return NextResponse.json(
        {
          error: {
            message: 'No handler available for this version',
            code: 'NO_HANDLER',
          },
        },
        { status: 500 }
      );
    };
  }
}

// ================================================================
// EXPORTS
// ================================================================

export { API_CONFIG, VERSION_REGISTRY };

// Example usage:
//
// // Simple versioned route
// export const POST = withVersioning(async (request, version) => {
//   const data = await analyzeUrl(request);
//   return versionedResponse(data, version, 201);
// });
//
// // Version-specific handlers
// export const GET = new VersionedRouteBuilder()
//   .version('v1', handleV1)
//   .version('v2', handleV2)
//   .build();
