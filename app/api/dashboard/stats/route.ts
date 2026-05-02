export const dynamic = 'force-dynamic';

// Libs
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalFaults = await prisma.faultLog.count();
    const openFaults = await prisma.faultLog.count({ where: { status: 'Open' } });
    const resolvedFaults = await prisma.faultLog.count({ where: { status: 'Resolved' } });
    const activeTools = await prisma.tool.count();

    // Fetch all resolved faults
    const resolvedLogs = await prisma.faultLog.findMany({
      where: { status: 'Resolved', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true }
    });

    // Calculate MTTR (Overall and Last 7 Days)
    let mttrHours = 0;
    let mttrTrend = 'STABLE';

    if (resolvedLogs.length > 0) {
      const totalRepairTimeMs = resolvedLogs.reduce((total, log) => {
        return total + (log.resolvedAt!.getTime() - log.createdAt.getTime());
      }, 0);

      const averageMs = totalRepairTimeMs / resolvedLogs.length;
      mttrHours = Number((averageMs / (1000 * 60 * 60)).toFixed(2));

      // Trend Calculation (Last 7 Days vs Overall)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentLogs = resolvedLogs.filter(log => log.resolvedAt! >= oneWeekAgo);
      if (recentLogs.length > 0) {
        const recentRepairTimeMs = recentLogs.reduce((total, log) => {
          return total + (log.resolvedAt!.getTime() - log.createdAt.getTime());
        }, 0);
        const recentMttrHours = Number(((recentRepairTimeMs / recentLogs.length) / (1000 * 60 * 60)).toFixed(2));

        if (recentMttrHours < mttrHours) mttrTrend = 'IMPROVING';
        else if (recentMttrHours > mttrHours) mttrTrend = 'DEGRADING';
      }
    }

    // Fetch the 10 most recent audit logs
    const recentActivity = await prisma.auditTrail.findMany({
      take: 10,
      orderBy: { actionTimestamp: 'desc' },
      include: { changedBy: { select: { fullName: true, role: true } } }
    });

    // Map the database response to frontend Zustand store format
    const formattedActivity = recentActivity.map((log) => ({
      id: log.id,
      actionType: log.actionType,
      timestamp: log.actionTimestamp,
      newState: log.newState,
      changedBy: log.changedBy
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalFaults,
        openFaults,
        resolvedFaults,
        activeTools,
        mttrHours,
        mttrTrend,
        recentActivity: formattedActivity
      }
    });
  } catch(error) {
    console.error('Stats Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
