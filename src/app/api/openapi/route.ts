/**
 * OpenAPI Specification Endpoint
 *
 * Serves the auto-generated OpenAPI 3.1 spec from Zod schemas
 * Phase 4, Week 8 - Backend Engineering Checklist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAPISpecJSON, getOpenAPISpecYAML } from '@/lib/api/openapi-generator';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

/**
 * GET /api/openapi
 *
 * Returns the OpenAPI specification in JSON or YAML format
 *
 * Query Parameters:
 * - format: 'json' | 'yaml' (default: 'json')
 *
 * @example
 * GET /api/openapi
 * GET /api/openapi?format=yaml
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  try {
    if (format === 'yaml') {
      const yamlSpec = getOpenAPISpecYAML();
      return new NextResponse(yamlSpec, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-yaml',
          'Content-Disposition': 'inline; filename="openapi.yaml"',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }

    const jsonSpec = getOpenAPISpecJSON();
    return new NextResponse(jsonSpec, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'inline; filename="openapi.json"',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate OpenAPI specification',
        code: 'OPENAPI_GENERATION_ERROR',
      },
      { status: 500 }
    );
  }
}
