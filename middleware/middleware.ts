// Libs
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map
const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Enterprise Security Headers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Rate Limiting for Authentication Routes
  if (request.nextUrl.pathname.startsWith('/api/auth/login')) {
    // both live ip and local ip fallback support
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
        JSON.stringify({ success: false, error: 'Security Lockout: Too many login attempts. Terminal locked for 60 seconds.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    currentUsage.count += 1;
    rateLimitMap.set(ip, currentUsage);
  }

  return response;
}

// Apply this middleware to all routes
export const config = {
  matcher: '/api/:path*',
};