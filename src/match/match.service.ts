/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
// src/match/match.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron} from '@nestjs/schedule';
import { GetMatchesDto } from './dto/get-matches.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. GET MATCHES FOR THE FRONTEND LOBBY
   async getMatches(dto: GetMatchesDto) {
    // If no date is provided, default to today
    const targetDate = dto.date ? new Date(dto.date) : new Date();
    
    // Set to start and end of the day for filtering
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    return await this.prisma.match.findMany({
      where: {
        fixtureDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { fixtureDate: 'asc' },
    });
  }

  // 2. THE BACKGROUND CRON JOB (Runs every 3 minute)
  // We use CronExpression.EVERY_MINUTE so it stays live during matches!
  @Cron('0 */3 * * * *')
  async syncLiveMatches() {
    this.logger.log('🔄 Fetching live matches from API-Football...');

    try {
      const apiKey = process.env.API_FOOTBALL_KEY;
      if (!apiKey) {
        this.logger.warn('⚠️ Missing API_FOOTBALL_KEY in .env. Skipping sync.');
        return;
      }

      // Fetch today's live fixtures (We use native fetch!)
      const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
        headers: {
          'x-apisports-key': apiKey,
        },
      });

      const data = await response.json();
      const fixtures = data.response || [];

      this.logger.log(`⚽ Found ${fixtures.length} live matches.`);

      // Loop through and update our database!
      for (const fixture of fixtures) {
        await this.prisma.match.upsert({
          where: { apiId: fixture.fixture.id },
          update: {
            homeScore: fixture.goals.home ?? 0,
            awayScore: fixture.goals.away ?? 0,
            status: fixture.fixture.status.short,
            matchTime: fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : null,
          },
          create: {
            apiId: fixture.fixture.id,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            homeLogo: fixture.teams.home.logo,
            awayLogo: fixture.teams.away.logo,
            homeScore: fixture.goals.home ?? 0,
            awayScore: fixture.goals.away ?? 0,
            status: fixture.fixture.status.short,
            matchTime: fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : null,
            fixtureDate: new Date(fixture.fixture.date),
          },
        });
      }
    } catch (error) {
      this.logger.error('❌ Failed to sync matches', error);
    }
  }
}