export interface RegisterDto {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  // Username is NOT here anymore
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
  bio?:     string; // Optional bio
}

export interface RefreshTokenDto {
  refreshToken: string;
}


//---------RESPONSE GOTTEN FROM BACKEND --------------//

export interface LoginResponse {
  userId: string;
  email:  string;
  role:   string;
  accessToken:  string; // 👈 Renamed from 'token'
  refreshToken: string; // 👈 New
  hasSelectedClub: boolean;
  hasUsername:     boolean;
}


export interface RegisterResponse {
  userId:  string;
  email:   string;
  message: string;
}