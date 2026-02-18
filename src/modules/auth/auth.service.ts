import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../libs/prisma";
import { RegisterDto, LoginDto, RegisterResponse, LoginResponse, VerifyEmailDto } from "./auth.types";
import { ROLE } from "../../generated/prisma/client"; // Use standard Prisma import
import { AppError } from "../../utils/AppError"; // Import AppError!

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export class AuthService {
  
  static async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existingUser) {
      throw new AppError("User already exists", 409); 
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        club: null,
        reputation: 0,
        role: ROLE.USER,
        isVerified: false,
        otp: otp,
        otpExpires: otpExpires
      },
    });

    console.log(`📧 SENDING OTP: ${otp} to ${dto.email}`);

    return {
      userId: newUser.id,
      email: newUser.email,
      message: "Please check your email for the verification code."
    };
  }

  static async verifyEmail(dto: VerifyEmailDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('User is already verified', 400);
    
    // Check OTP
    if (!user.otp || user.otp !== dto.otp) throw new AppError('Invalid OTP', 400);
    if (user.otpExpires && new Date() > user.otpExpires) throw new AppError('OTP has expired', 400);

    // Activate User
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExpires: null }
    });

    // OPTIONAL: Generate token immediately so they don't have to login again
    const token = this.generateToken(user.id, user.club, user.role);

    return { message: "Email verified successfully.", token };
  }

  static async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    // Combine User Not Found & Bad Password for security
    if (!user) throw new AppError('Invalid credentials', 401);
    
    if (!user.isVerified) throw new AppError('Please verify your email first', 401);

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    const token = this.generateToken(user.id, user.club, user.role);

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      token: token,
      hasSelectedClub: !!user.club 
    };
  }

  static async selectClub(userId: string, clubName: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { club: clubName }
    });
  }
  
  private static generateToken(userId: string, club: string | null, role: string): string {
    return jwt.sign(
      { id: userId, club: club || "", role: role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
  }
}