import { User } from '../../../src/generated/prisma/client';

// --- INPUT TYPES (DTOs) ---

export interface RegisterDto {
  username: string;
  email:    string;
  password: string;
}

export interface LoginDto {
  email:    string;
  password: string;
}

// Add this to your existing types
export interface VerifyEmailDto {
  email: string;
  otp:   string;
}

// --- OUTPUT TYPES ---

export interface LoginResponse {
  userId: string;
  email: string;
  role: string;
  token: string;
  hasSelectedClub: boolean; // <--- The new critical flag
}


export interface RegisterResponse {
  userId: string;
  email:   string;
  message: string
}