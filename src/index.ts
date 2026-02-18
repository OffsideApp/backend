import dotenv from 'dotenv';
// Load env vars BEFORE importing app
dotenv.config();

import app from './app';
import { prisma } from './libs/prisma';

const PORT = process.env.PORT || 5000;

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`\n⚽️  OFFSIDE SERVER STARTED  ⚽️`);
  console.log(`🚀  Listening on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Test Database Connection
//   try {
//     await prisma.$connect();
//     console.log('✅  Database Connected Successfully');
//   } catch (error) {
//     console.error('❌  Database Connection Failed:', error);
//   }
// });

// Handle Unhandled Rejections (e.g. Database crashes)
process.on('unhandledRejection', (err: any) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
})