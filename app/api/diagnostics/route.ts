export const dynamic = 'force-dynamic';

// Libs
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetNode, status, notes, hardwareId } = body;

    const technician = await prisma.technician.findFirst({
      where: { registeredHardwareId: hardwareId }
    });

    if (!!technician === false) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid hardware signature' }, { status: 403 });
    }

    // Atomic Transaction Block
    await prisma.$transaction(async (tx) => {
      let fault = await tx.faultLog.findFirst({
        where: { markerId: targetNode }
      });

      let action = 'UPDATE';

      if (!!fault) {
        fault = await tx.faultLog.update({
          where: { id: fault.id },
          data: {
            status: status,
            annotationNotes: notes,
            resolvedAt: status === 'Resolved' ? new Date() : null
          }
        });
      } else {
        action = 'INSERT';
        fault = await tx.faultLog.create({
          data: {
            markerId: targetNode,
            status: status,
            severity: 'Warning',
            annotationNotes: notes,
            spatialX: 0.0,
            spatialY: 0.0,
            spatialZ: 0.0,
            resolvedAt: status === 'Resolved' ? new Date() : null
          }
        });
      }

      await tx.auditTrail.create({
        data: {
          targetTable: 'FaultLog',
          targetRecordId: fault.id,
          actionType: action,
          changedById: technician.id,
          newState: fault as any
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch(error) {
    console.error('Diagnostic Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
