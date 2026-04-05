/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { MatchService } from './match.service';
import { GetMatchesDto } from './dto/get-matches.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard'; // Use your existing guard

@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  async getMatches(@Query() dto: GetMatchesDto) {
    // 🚀 Look how clean this is! The DTO automatically handles the query params
    const matches = await this.matchService.getMatches(dto);
    return { success: true, data: matches };
  }

  @Post('sync')
  async forceSync() {
    await this.matchService.fetchDailyFixtures();
    return { message: 'Matches synced successfully! Check your app.' };
  }
}