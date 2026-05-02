export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditTrail.findMany({
      include: { changedBy: { select: { fullName: true } } },
      orderBy: { actionTimestamp: 'desc' }
    });

    // Create CSV Header
    let csv = 'ID,Timestamp,Action Type,Target Table,Operator,Payload\n';

    // Map data to rows securely
    logs.forEach(log => {
      const timestamp = new Date(log.actionTimestamp).toISOString();
      const newStateString = JSON.stringify(log.newState || {}).replace(/"/g, '""');
      csv += `${log.id},${timestamp},${log.actionType},${log.targetTable},${log.changedBy.fullName},"${newStateString}"\n`;
    });

    // Return as a downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="occlusion_audit_trail.csv"'
      }
    });

  } catch (error) {
    console.error('CSV Export Error:', error);
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }
}