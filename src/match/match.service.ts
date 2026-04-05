/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
// src/match/match.service.ts
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetMatchesDto } from './dto/get-matches.dto';
import { MatchGateway } from './match.gateway';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  
  // 🚀 The API-Football Circuit Breaker limits
  private apiCallsToday = 0;
  private lastPollTime = 0;
  private readonly MAX_CALLS = 90; // Keep 10 in reserve for emergencies!

  // 🚀 The "Top Tier" Whitelist (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UCL, Europa, Carabao)
  private readonly SUPPORTED_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 48];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MatchGateway))
    private readonly matchGateway: MatchGateway, // Inject the gateway to broadcast goals!
  ) {}

  async getMatches(dto: GetMatchesDto) {
    const targetDate = dto.date ? new Date(dto.date) : new Date();
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

  // ==========================================
  // THE 100-REQUEST SURVIVAL ENGINE
  // ==========================================

  // 1. Reset Counter every midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  resetApiCounter() {
    this.apiCallsToday = 0;
    this.logger.log('🔄 API limit counter reset to 0.');
  }

  // 2. The 6:00 AM Discovery Job (Costs exactly 1 API Request)
  @Cron('0 6 * * *') 
  async fetchDailyFixtures() {
    if (this.apiCallsToday >= this.MAX_CALLS) return;

    this.logger.log('🌅 Running 6:00 AM Daily Discovery...');
    const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    try {
      this.apiCallsToday++;
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${todayStr}`, {
        headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY as string },
      });
      const data = await response.json();
      const allFixtures = data.response || [];

      // Filter ONLY our top tier leagues
      const eliteFixtures = allFixtures.filter((f: any) => 
        this.SUPPORTED_LEAGUES.includes(f.league.id)
      );

      this.logger.log(`⚽ Found ${eliteFixtures.length} Elite Matches for today.`);

      for (const fixture of eliteFixtures) {
        await this.prisma.match.upsert({
          where: { apiId: fixture.fixture.id },
          update: { fixtureDate: new Date(fixture.fixture.date) },
          create: {
            apiId: fixture.fixture.id,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            homeLogo: fixture.teams.home.logo,
            awayLogo: fixture.teams.away.logo,
            homeScore: fixture.goals.home ?? 0,
            awayScore: fixture.goals.away ?? 0,
            status: fixture.fixture.status.short,
            fixtureDate: new Date(fixture.fixture.date),
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to run Daily Discovery', error);
    }
  }

  // 3. The Adaptive Live Poller (Runs every minute, but only fetches when needed)
  @Cron(CronExpression.EVERY_MINUTE)
  async adaptiveLivePolling() {
    if (this.apiCallsToday >= this.MAX_CALLS) {
      this.logger.warn('🚨 CRITICAL: API Limit Reached (90/100). Live polling suspended for the day.');
      return;
    }

    // Get today's matches from DB
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const todaysMatches = await this.prisma.match.findMany({
      where: { fixtureDate: { gte: startOfDay } }
    });

    // Check match states
    const liveMatches = todaysMatches.filter(m => ['1H', 'HT', '2H', 'ET', 'P'].includes(m.status));
    
    // Are any matches starting in the next 15 mins?
    const upcomingMatches = todaysMatches.filter(m => {
      const timeToKickoff = m.fixtureDate.getTime() - new Date().getTime();
      return m.status === 'NS' && timeToKickoff > 0 && timeToKickoff <= 15 * 60000;
    });

    if (liveMatches.length === 0 && upcomingMatches.length === 0) {
      return; // 🛑 Do absolutely nothing. Save API requests!
    }

    // --- The Adaptive Interval Logic ---
    let targetIntervalMinutes = 5; // Default: Every 5 mins for pre-match/half-time

    if (liveMatches.length > 0) {
      // Is it "Crunch Time" (Past the 80th minute?)
      const isCrunchTime = liveMatches.some(m => {
        if (!m.matchTime) return false;
        const mins = parseInt(m.matchTime.replace("'", ''));
        return mins >= 80;
      });

      targetIntervalMinutes = isCrunchTime ? 1.5 : 3; // 90 seconds for Crunch Time, 3 mins for Normal Play
    }

    const minutesSinceLastPoll = (new Date().getTime() - this.lastPollTime) / 60000;

    // Only fire the API request if enough time has passed based on the current match phase!
    if (minutesSinceLastPoll >= targetIntervalMinutes) {
      await this.executeLiveFetch(liveMatches);
    }
  }

  private async executeLiveFetch(liveDbMatches: any[]) {
    this.logger.log(`⚡ Live Polling... (Calls today: ${this.apiCallsToday + 1}/${this.MAX_CALLS})`);
    this.lastPollTime = new Date().getTime();
    this.apiCallsToday++;

    try {
      // Request ONLY live matches for our Whitelisted Leagues (Costs exactly 1 Request!)
      const leagueString = this.SUPPORTED_LEAGUES.join('-');
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?live=${leagueString}`, {
        headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY as string },
      });
      const data = await response.json();
      const liveFixtures = data.response || [];

      for (const fixture of liveFixtures) {
        // Compare new API data against what is currently in our DB
        const dbMatch = liveDbMatches.find(m => m.apiId === fixture.fixture.id);
        
        const newHomeScore = fixture.goals.home ?? 0;
        const newAwayScore = fixture.goals.away ?? 0;
        const newStatus = fixture.fixture.status.short;
        const newTime = fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : null;

        // Has anything changed? (Goal scored, half-time, full-time?)
        const isScoreChange = dbMatch && (dbMatch.homeScore !== newHomeScore || dbMatch.awayScore !== newAwayScore);
        const isStatusChange = dbMatch && (dbMatch.status !== newStatus);

        if (isScoreChange || isStatusChange || !dbMatch) {
          if (isScoreChange) this.logger.log(`🚨 GOAL!!! Match ${fixture.fixture.id} is now ${newHomeScore}-${newAwayScore}`);

          // 1. Update Database
          const updatedMatch = await this.prisma.match.update({
            where: { apiId: fixture.fixture.id },
            data: {
              homeScore: newHomeScore,
              awayScore: newAwayScore,
              status: newStatus,
              matchTime: newTime,
            },
          });

          // 2. 🚀 INSTANTLY PUSH UPDATE TO WEBSOCKETS!
          this.matchGateway.broadcastScoreUpdate(updatedMatch.id, updatedMatch);
        } else {
          // If just the minute changed (e.g., 67' to 68'), just silently update the DB without alerting the WebSocket
          await this.prisma.match.update({
            where: { apiId: fixture.fixture.id },
            data: { matchTime: newTime },
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed live fetch', error);
    }
  }
}