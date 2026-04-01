/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Good for loading .env globally
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AuthModule } from './auth/auth.module';
import { FeedModule } from './feed/feed.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Loads your .env file
    PrismaModule,
    CloudinaryModule,
    AuthModule, // 🚀 Plugs in your Auth routes
    FeedModule, // 🚀 Plugs in your Feed routes
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}