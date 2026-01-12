import { PrismaClient } from '../../generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Prisma adapter for SQLite
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

// Create a single instance of PrismaClient to be reused across the application
// This prevents creating multiple database connections
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Gracefully disconnect on application shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
