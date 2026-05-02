export const dynamic = 'force-dynamic';

// Libs
import { NextResponse } from 'next/server';

// Services
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolId, toolName, hardwareId } = body;

    const technician = await prisma.technician.findFirst({
      where: { registeredHardwareId: hardwareId }
    });

    if (!!technician === false) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Atomic Transaction Block
    await prisma.$transaction(async (tx) => {
      let tool = await tx.tool.findFirst({
        where: { toolName: toolName || toolId }
      });

      if (!!tool) {
        tool = await tx.tool.update({
          where: { id: tool.id },
          data: { lastTrackedAt: new Date() }
        });
      } else {
        tool = await tx.tool.create({
          data: {
            toolName: toolName || toolId,
            category: 'Diagnostic Equipment',
            lastKnownX: 0.0,
            lastKnownY: 0.0,
            lastKnownZ: 0.0,
            lastTrackedAt: new Date()
          }
        });
      }

      // Atomic Transactionally Safe!
      await tx.auditTrail.create({
        data: {
          targetTable: 'Tool',
          targetRecordId: tool.id,
          actionType: 'CHECKOUT',
          changedById: technician.id,
          newState: tool as any
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch(error) {
    console.error('Tracking Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}