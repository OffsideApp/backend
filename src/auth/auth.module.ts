import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],

  // 🚀 IMPORTANT: We export the Guard and JwtModule so the FeedModule can use them to protect its routes!
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
