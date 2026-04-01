// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 🚀 Makes Prisma available everywhere without importing the module repeatedly
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 🚀 This is the NestJS equivalent of "export { prisma }"
})
// eslint-disable-next-line prettier/prettier
export class PrismaModule {}