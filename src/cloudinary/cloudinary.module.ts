// src/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
  controllers: [CloudinaryController], // 🚀 CRITICAL: This is what allows AuthModule and FeedModule to use it!
})
export class CloudinaryModule {}
