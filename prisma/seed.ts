import 'dotenv/config';

// Libs
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';

// Safety check
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is completely missing! Check your .env file.");
}

// Setup the adapter
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seeded Password
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword) {
    throw new Error("CRITICAL: ADMIN_SEED_PASSWORD missing from .env");
  }

  const defaultPassword = await argon2.hash(seedPassword);

  // User : Dev team
  await prisma.technician.upsert({
    where: { employeeId: 'DEV-001' },
    update: {},
    create: {
      employeeId: 'DEV-001',
      fullName: 'Lead System Developer',
      role: 'SuperAdmin',
      passwordHash: defaultPassword,
      registeredHardwareId: 'IPAD-PRO-998877',
    },
  });

  // User : Admin // Manager
  await prisma.technician.upsert({
    where: { employeeId: 'ADM-001' },
    update: {},
    create: {
      employeeId: 'ADM-001',
      fullName: 'Shift Supervisor',
      role: 'Admin',
      passwordHash: defaultPassword,
      registeredHardwareId: 'IPAD-PRO-998877',
    },
  });

  // User : General User // Technician
  await prisma.technician.upsert({
    where: { employeeId: 'TECH-001' },
    update: {},
    create: {
      employeeId: 'TECH-001',
      fullName: 'Field AR Operator',
      role: 'Technician',
      passwordHash: defaultPassword,
      registeredHardwareId: 'AR-GLASSES-112233',
    },
  });

  console.log('Database successfully seeded with standard RBAC users.');
}

// Run seeder
main()
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
