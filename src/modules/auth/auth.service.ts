import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../libs/prisma";
import { RegisterDto, LoginDto, RegisterResponse, LoginResponse, VerifyEmailDto, SetProfileDto, RefreshTokenDto } from "./auth.types";
import { ROLE } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "another_secret_key";

export class AuthService {
  
  // 1. REGISTER
  static async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new AppError("User already exists", 409); 
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // A. Create User
    const newUser = await prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        username: null,
        club: null,
        bio: null,
        reputation: 0,
        role: ROLE.USER,
        isVerified: false,
      },
    });

    // B. Generate & Save OTP in Separate Table
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.oTP.create({
      data: {
        code: otpCode,
        expiresAt: otpExpires,
        userId: newUser.id
      }
    });

    console.log(`📧 SENDING OTP: ${otpCode} to ${dto.email}`);

    return {
      userId: newUser.id,
      email: newUser.email,
      message: "Please check your email for the verification code."
    };
  }

  // 2. VERIFY EMAIL (Now checks OTP table)
  static async verifyEmail(dto: VerifyEmailDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('User is already verified', 400);
    
    // Find Valid OTP in the OTP Table
    const validOtp = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        code: dto.otp,
        expiresAt: { gt: new Date() } // Must be in the future
      }
    });

    if (!validOtp) throw new AppError('Invalid or expired OTP', 400);

    // Activate User
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });

    // Cleanup: Delete used OTPs
    await prisma.oTP.deleteMany({ where: { userId: user.id } });

    return { message: "Email verified successfully. Please login." };
  }

  // 3. LOGIN
  static async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) throw new AppError('Invalid credentials', 401);
    if (!user.isVerified) throw new AppError('Please verify your email first', 401);

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);


    const { accessToken, refreshToken } = this.generateToken(user.id,  user.role);

    // Hash Refresh Token & Save to DB
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken }
    });

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
      hasUsername: !!user.username,    // 🚦 New Check
      hasSelectedClub: !!user.club     // 🚦 Old Check
    };
  }

  // 4. SET PROFILE (Username + Bio)
  static async setProfile(dto: SetProfileDto)  {
    // Check uniqueness
    const taken = await prisma.user.findUnique({ where: { username: dto.username } });
    
    // Allow if it's the SAME user (updating bio), block if different user
    if (taken && taken.id !== dto.userId) {
      throw new AppError("Username already taken", 409);
    }

    return await prisma.user.update({
      where: { id: dto.userId },
      data: { username: dto.username, bio: dto.bio }
    });
  }

  // 5. SELECT CLUB
  static async selectClub(userId: string, clubName: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { club: clubName }
    });
  }

  static async refreshToken(dto: RefreshTokenDto) {
    // 1. Verify the signature of the token
    let decoded;
    try {
      decoded = jwt.verify(dto.refreshToken, REFRESH_SECRET) as any;
    } catch (err) {
      throw new AppError("Invalid Refresh Token", 403);
    }

    // 2. Check if User exists & has a refresh token in DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.refreshToken) {
      throw new AppError("Invalid Request", 403);
    }

    // 3. Compare the sent token with the Hashed one in DB
    const isMatch = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isMatch) {
      // SECURITY: If they don't match, someone might be trying to reuse an old token!
      // Option: Invalidate all tokens for this user here if you want to be strict.
      throw new AppError("Invalid Refresh Token", 403);
    }

    // 4. Generate NEW Access Token (Keep same Refresh Token or Rotate it)
    // For simplicity, we just issue a new Access Token here.
    const newAccessToken = jwt.sign(
      { id: user.id, club: user.club || "", role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '15m' } // Short life!
    );

    return { accessToken: newAccessToken };
  }
  
  private static generateToken(userId: string,  role: string) {
    const accessToken = jwt.sign(
      { id: userId,  role: role }, 
      JWT_SECRET, 
      { expiresIn: '15m' } // 15 Minutes
    );

    const refreshToken = jwt.sign(
      { id: userId }, 
      REFRESH_SECRET, 
      { expiresIn: '7d' } // 7 Days
    );

    return { accessToken, refreshToken };
  }
}