// Libs
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map
const rateLimitMap = new Map();

const getAllowedOrigin = (request: NextRequest) => {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://occlusion-dashboard.vercel.app',
    'http://localhost:3000'
  ];
  if (!!origin && allowedOrigins.includes(origin)) return origin;
  return allowedOrigins[0];
};

export function middleware(request: NextRequest) {
  const origin = getAllowedOrigin(request);

  // 1. CORS Preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  const response = NextResponse.next();

  // Enterprise Security Headers
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith('/api/auth/login');

  // Rate Limiting
  if (isLoginRoute) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const currentUsage = rateLimitMap.get(ip) || { count: 0, lastReset: Date.now() };

    // Reset the counter every 60 seconds
    if (Date.now() - currentUsage.lastReset > 60000) {
      currentUsage.count = 0;
      currentUsage.lastReset = Date.now();
    }

    // Lockout after 5 failed attempts in 1 minute
    if (currentUsage.count >= 5) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Security Lockout: Too many login attempts.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    currentUsage.count += 1;
    rateLimitMap.set(ip, currentUsage);
  }

  // If they are trying to access the API, they must have a cookie.
  if (!isLoginRoute && pathname.startsWith('/api/')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized: Active terminal session required.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return response;
}

// Apply this middleware to all routes
export const config = {
  matcher: '/api/:path*',
};