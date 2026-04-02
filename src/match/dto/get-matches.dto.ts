/* eslint-disable prettier/prettier */
// src/match/dto/get-matches.dto.ts
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GetMatchesDto {
  @IsOptional()
  @IsDateString()
  date?: string; // e.g., "2024-10-25"

  @IsOptional()
  @IsString()
  status?: string; // e.g., "LIVE" or "FINISHED"
}