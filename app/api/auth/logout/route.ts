// Libs
import { NextResponse } from 'next/server';

// Logout API Endpoint
export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Session terminated securely.'
    });

    // Destroy the cookie by setting its maxAge to 0
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch(error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
}