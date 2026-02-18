import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../libs/prisma";
import { RegisterDto, LoginDto, RegisterResponse, LoginResponse, VerifyEmailDto } from "./auth.types";
import { ROLE } from "../../generated/prisma/enums";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export class AuthService {
static async register(dto: RegisterDto): Promise<RegisterResponse> {
    // A. Check existing
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // B. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // C. Generate OTP (The Missing Piece!)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // D. Create User
    const newUser = await prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        reputation: 0,
        role: ROLE.USER,       // Enforce USER role here
        isVerified: false,     // User is NOT verified yet
        otp: otp,              // Save the code
        otpExpires: otpExpires
      },
    });

    // E. Mock Send Email (In production, replace with email service)
    console.log(`📧 SENDING OTP: ${otp} to ${dto.email}`);

    // F. Return
    return {
      userId: newUser.id,
      email: newUser.email,
      message: "Please check your email for the verification code."
    };
  }
  

  //----------LOGIN LOGIC------------//
  static async login(dto: LoginDto): Promise<LoginResponse> {
    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Block Unverified Users
    if (!user.isVerified) {
      throw new Error('Please verify your email first');
    }

    // 3. Check Password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // 4. Generate Token (Safe for null clubs)
    const token = this.generateToken(user.id, user.club, user.role);

    // 5. Return Data
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      token: token,
      
      // LOGIC: If user.club is null/empty, this is false.
      // Frontend checks this: if (false) -> navigate('SelectClubScreen')
      hasSelectedClub: !!user.club 
    };
  }

  // Add this inside your AuthService class
static async verifyEmail(dto: VerifyEmailDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });

  if (!user) throw new Error('User not found');
  if (user.isVerified) throw new Error('User is already verified');
  
  // Check OTP
  if (!user.otp || user.otp !== dto.otp) throw new Error('Invalid OTP');
  if (user.otpExpires && new Date() > user.otpExpires) throw new Error('OTP has expired');

  // Activate User
  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otp: null, otpExpires: null }
  });

  return { message: "Email verified successfully. You can now login." };
}

  static async selectClub(userId: string, clubName: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { club: clubName }
  });
}
  
  // --- PRIVATE HELPER ---
 // In AuthService class...

  private static generateToken(userId: string, club: string | null, role: string): string {
    return jwt.sign(
      { 
        id: userId, 
        club: club || "", // If club is null, store empty string
        role: role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
  }
}
