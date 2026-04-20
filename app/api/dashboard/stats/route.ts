import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });


export async function GET() {
  try {
    // 1. Fetch aggregate data from the database
    const totalFaults = await prisma.faultLog.count();
    const openFaults = await prisma.faultLog.count({ where: { status: 'Open' } });
    const resolvedFaults = await prisma.faultLog.count({ where: { status: 'Resolved' } });
    const activeTools = await prisma.tool.count();

    // 2. Return data securely to the frontend
    return NextResponse.json({
      success: true,
      data: {
        totalFaults,
        openFaults,
        resolvedFaults,
        activeTools,
        // Mock MTTR (Mean Time To Repair) for the TRL 3 prototype demonstration
        mttrHours: 4.2
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}