// Libs
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Database Connection
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// Dashboard Stats API Endpoint
export async function GET() {
  try {
    // Fetch aggregate data from the database
    const totalFaults = await prisma.faultLog.count();
    const openFaults = await prisma.faultLog.count({ where: { status: 'Open' } });
    const resolvedFaults = await prisma.faultLog.count({ where: { status: 'Resolved' } });
    const activeTools = await prisma.tool.count();

    // Fetch the 10 most recent audit logs and include the technician data
    const recentActivity = await prisma.auditTrail.findMany({
      take: 10,
      orderBy: {
        actionTimestamp: 'desc'
      },
      include: {
        changedBy: {
          select: {
            fullName: true,
            role: true
          }
        }
      }
    });

    // Map the database response to exactly what the frontend Zustand store expects
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
        // Mock MTTR (Mean Time To Repair) for the TRL 3 prototype demonstration REPLACE LATER IF WE NEED
        mttrHours: 4.2,
        recentActivity: formattedActivity
      }
    });
  } catch(error) {
    console.error('Stats Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}