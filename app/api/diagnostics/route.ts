// Libs
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Services
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!!token === false) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const body = await request.json();
    const { targetNode, status, notes, hardwareId } = body;

    const technician = await prisma.technician.findFirst({
      where: { registeredHardwareId: hardwareId }
    });

    if (!!technician === false) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid hardware signature' }, { status: 403 });
    }

    // Create the Fault Log using app data
    const newLog = await prisma.faultLog.create({
      data: {
        markerId: targetNode,
        status: status || 'Resolved',
        severity: 'Checked',
        annotationNotes: notes || 'Resolved via AR Technician Terminal',
        spatialX: 0.0,
        spatialY: 0.0,
        spatialZ: 0.0,
        resolvedAt: new Date()
      }
    });

    // Generate the Audit Trail
    await prisma.auditTrail.create({
      data: {
        targetTable: 'FaultLog',
        targetRecordId: newLog.id,
        actionType: 'RESOLVE',
        changedById: technician.id,
        newState: newLog as any
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Diagnostic synchronized with mainframe.'
    });

  } catch(error) {
    console.error('Diagnostic Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
