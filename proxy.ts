// Libs
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Define which routes the proxy should protect
export const config = {
  matcher: ['/api/dashboard/:path*', '/api/ar/:path*'],
};

export async function proxy(request: NextRequest) {
  try {
    // 1. Check for the secure HttpOnly cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing token' },
        { status: 401 }
      );
    }

    // 2. Verify the JWT signature securely on the Edge
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    // 3. Optional: Role-Based Access Control (RBAC) Check
    // If they are trying to access the dashboard, they MUST be an Admin/SuperAdmin
    const isDashboardRoute = !!request.nextUrl.pathname.startsWith('/api/dashboard');
    const isTechnician = payload.role === 'Technician';

    if (!!isDashboardRoute && !!isTechnician) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }

    // 4. Let them through!
    return NextResponse.next();

  } catch (error) {
    console.error('proxy JWT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or expired token' },
      { status: 401 }
    );
  }
}
