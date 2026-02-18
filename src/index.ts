import dotenv from 'dotenv';

// 1️⃣ Load environment variables FIRST
dotenv.config();

import app from './app';
import { prisma } from './libs/prisma';

const PORT = process.env.PORT || 5000;
const HOST = 'http://localhost';

// 2️⃣ Start Server
const server = app.listen(PORT, () => {
  const baseURL = `${HOST}:${PORT}`;

  console.log('\n⚽️  OFFSIDE SERVER STARTED  ⚽️');
  console.log(`🚀  Server running at: ${baseURL}`);
  console.log(`📡  API Base URL: ${baseURL}/api/v1`);
  console.log(`❤️  Health Check: ${baseURL}`);
  console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});


// 3️⃣ Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err: any) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(`${err.name}: ${err.message}`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
});


// 4️⃣ Handle Uncaught Exceptions
process.on('uncaughtException', (err: any) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(`${err.name}: ${err.message}`);
  process.exit(1);
});
