// src/prisma/prisma.service.ts
import 'dotenv/config'; // Ensure env variables are loaded early
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
//  Use your custom path if you are still generating it there,
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Get the connection string
    const connectionString = `${process.env.DATABASE_URL}`;

    // 2. Create the pg Pool (REQUIRED: PrismaPg takes a Pool, not a string)
    const pool = new Pool({ connectionString });

    // 3. Create the Prisma adapter
    const adapter = new PrismaPg(pool);

    // 4. Pass the adapter to the PrismaClient class we are extending
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
