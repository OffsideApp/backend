import 'dotenv/config';
import { Pool } from 'pg'; // 🚀 1. You missed this import!
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client'; // 🚀 2. Use the standard import

const connectionString = `${process.env.DATABASE_URL}`;

// 3. Create the database pool first
const pool = new Pool({ connectionString });

// 4. Pass the pool into the adapter

const adapter = new PrismaPg(pool);

// 5. Initialize Prisma

const prisma = new PrismaClient({ adapter });

export { prisma };
