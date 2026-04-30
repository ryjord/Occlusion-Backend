// Libs
import { NextResponse } from 'next/server';

// Services
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const faults = await prisma.faultLog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: faults
    });
  } catch(error) {
    console.error('Failed to fetch fault directory', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}