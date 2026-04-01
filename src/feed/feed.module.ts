import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, AuthModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
