// Libs
import { NextResponse } from 'next/server';

// Services
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: { lastTrackedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: tools
    });
  } catch(error) {
    console.error('Failed to fetch hardware directory', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}