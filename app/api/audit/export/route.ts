export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Require an active web session
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized: Active terminal session required for data export.', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Fetch the Data (Only reached if authenticated)
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
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
