/**
 * CSRF Token API Endpoint
 *
 * RED TEAM AUDIT FIX: MEDIUM-002
 * Provides CSRF tokens for client-side forms
 */

import { NextRequest } from 'next/server';
import { getCSRFTokenHandler } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  return getCSRFTokenHandler(request);
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
