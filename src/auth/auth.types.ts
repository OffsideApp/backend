/* eslint-disable prettier/prettier */
// src/auth/auth.types.ts
export interface RegisterDto {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
}

export interface LoginDto {
  email:    string;
  password: string;
}

export interface VerifyEmailDto {
  email: string;
  otp:   string;
}

export interface SetProfileDto {
  userId: string;
  username: string;
  bio?:     string; 
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface selectClubDto{
  userId: string;
  clubName: string;
}

export interface LoginResponse {
  userId: string;
  email:  string;
  role:   string;
  accessToken:  string; 
  refreshToken: string; 
  hasSelectedClub: boolean;
  hasUsername:     boolean;
  username: string | null;
  club: string | null;
  avatar: string | null;
  bio: string | null;
}

export interface RegisterResponse {
  userId:  string;
  email:   string;
  message: string;
}