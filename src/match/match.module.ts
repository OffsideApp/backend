/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { AuthModule } from '../auth/auth.module'; // Needed for the JwtAuthGuard
import { PrismaModule } from 'prisma/prisma.module';
import { MatchGateway } from './match.gateway';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MatchController],
  providers: [MatchService, MatchGateway],
  exports:[MatchService, MatchGateway]
})
export class MatchModule {}