// Libs
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Services
import { AuthService } from '@/services/auth.service';

// Zod Schema for strict input validation
const loginSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  hardwareId: z.string().min(1, 'Hardware ID telemetry is required')
});

// Login API Endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = loginSchema.parse(body);

    // Call abstracted service logic
    const user = await AuthService.authenticateUser(
      validatedData.employeeId,
      validatedData.password,
      validatedData.hardwareId
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or unauthorized device.' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = AuthService.generateToken(user);

    // Create secure response
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        role: user.role
      }
    });

    // Apply HttpOnly Cookie (Prevents Cross-Site Scripting attacks)
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 12,
      path: '/',
    });

    return response;

  } catch(error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // Explicit string checking for custom errors
    if (error instanceof Error && !!error.message.includes('Hardware ID')) {
      return NextResponse.json(
        { success: false, error: 'Terminal locked: Hardware mismatch.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}