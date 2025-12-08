/**
 * Next.js Middleware
 *
 * SRE AUDIT FIX: SRE-002, SRE-005
 * Protects admin routes with authentication
 *
 * Features:
 * - Admin route protection (requires authenticated session)
 * - Request ID injection for tracing
 * - Environment-aware security (stricter in production)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ================================================================
// CONFIGURATION
// ================================================================

const ADMIN_ROUTES = ['/admin', '/api/admin'];
const PUBLIC_ROUTES = [
  '/',
  '/analyze',
  '/results',
  '/pricing',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/cookies',
  '/faq',
  '/glossary',
  '/api/health',
  '/api/analyze',
  '/api/billing/webhook',
];

// Admin email whitelist - configured via environment variable for security
// ADMIN_EMAILS should be set in Vercel/hosting environment (never in code)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  // Static files and API routes that don't need protection
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // files with extensions
  ) {
    return true;
  }

  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

function generateRequestId(): string {
  return crypto.randomUUID();
}

// ================================================================
// MIDDLEWARE
// ================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate request ID for tracing
  const requestId = request.headers.get('x-request-id') || generateRequestId();

  // Create response with request ID header
  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Add request ID to response headers
  response.headers.set('x-request-id', requestId);

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Check if admin route
  if (isAdminRoute(pathname)) {
    // Create Supabase client with cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    try {
      // Get user session
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        // Not authenticated - redirect to login or return 401
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ERR_UNAUTHORIZED',
                message: 'Authentication required for admin API'
              }
            },
            {
              status: 401,
              headers: { 'x-request-id': requestId }
            }
          );
        }

        // Redirect to home page for non-API routes
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('error', 'admin_auth_required');
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Check if user email is in admin whitelist
      const userEmail = user.email?.toLowerCase();
      const isAdmin = userEmail && ADMIN_EMAILS.some(
        email => email.toLowerCase() === userEmail
      );

      if (!isAdmin) {
        // User is authenticated but not an admin
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ERR_FORBIDDEN',
                message: 'Admin access required'
              }
            },
            {
              status: 403,
              headers: { 'x-request-id': requestId }
            }
          );
        }

        // Redirect non-admins to home
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('error', 'admin_access_denied');
        return NextResponse.redirect(redirectUrl);
      }

      // Admin authenticated - allow access
      // Add user info to headers for downstream use
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');

    } catch (err) {
      // Supabase error - fail closed (deny access)
      console.error('[Middleware] Auth error:', err);

      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ERR_AUTH_FAILED',
              message: 'Authentication service unavailable'
            }
          },
          {
            status: 503,
            headers: { 'x-request-id': requestId }
          }
        );
      }

      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'auth_service_error');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

// ================================================================
// MATCHER CONFIG
// ================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
