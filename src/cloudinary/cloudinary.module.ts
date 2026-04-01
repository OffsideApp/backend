// src/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService], // 🚀 CRITICAL: This is what allows AuthModule and FeedModule to use it!
})
export class CloudinaryModule {}
