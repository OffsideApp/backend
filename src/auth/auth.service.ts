/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ROLE } from '../../generated/prisma/client';
import {
  RegisterDto,
  LoginDto,
  RegisterResponse,
  LoginResponse,
  VerifyEmailDto,
  SetProfileDto,
  RefreshTokenDto,
  selectClubDto,
} from './auth.types';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  // 🚀 INJECT Prisma and JWT Services
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists'); // 👈 Replaces AppError(..., 409)
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newUser = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        role: ROLE.USER,
        isVerified: false,
      },
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.oTP.create({
      data: {
        code: otpCode,
        expiresAt: otpExpires,
        userId: newUser.id,
      },
    });

    console.log(`📧 SENDING OTP: ${otpCode} to ${dto.email}`);

    return {
      userId: newUser.id,
      email: newUser.email,
      message: 'Please check your email for the verification code.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('User is already verified');

    const validOtp = await this.prisma.oTP.findFirst({
      where: {
        userId: user.id,
        code: dto.otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!validOtp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await this.prisma.oTP.deleteMany({ where: { userId: user.id } });

    return { message: 'Email verified successfully. Please login.' };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isVerified) {
      throw new UnauthorizedException('Invalid credentials or unverified email');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = this.generateToken(user.id, user.role);

    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
      hasUsername: !!user.username,
      hasSelectedClub: !!user.club,
      username: user.username,
      club: user.club,
      avatar: user.avatar,
      bio: user.bio,
    };
  }

  async setProfile(dto: SetProfileDto) {
    const taken = await this.prisma.user.findUnique({ where: { username: dto.username } });

    if (taken && taken.id !== dto.userId) {
      throw new ConflictException('Username already taken');
    }

    return await this.prisma.user.update({
      where: { id: dto.userId },
      data: { username: dto.username, bio: dto.bio },
    });
  }

  async selectClub(dto: selectClubDto) {
    return await this.prisma.user.update({
      where: { id: dto.userId },
      data: { club: dto.clubName },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  async toggleFollow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException("You cannot follow yourself bro, that's sad.");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { followers: { select: { id: true } } },
    });

    if (!targetUser) throw new NotFoundException('User not found');

    const isFollowing = targetUser.followers.some((follower) => follower.id === currentUserId);

    if (isFollowing) {
      await this.prisma.user.update({
        where: { id: currentUserId },
        data: { following: { disconnect: { id: targetUserId } } },
      });
      return { message: 'Unfollowed successfully' };
    } else {
      await this.prisma.user.update({
        where: { id: currentUserId },
        data: { following: { connect: { id: targetUserId } } },
      });
      return { message: 'Followed successfully' };
    }
  }

  async getProfile(identifier: string, isUsername: boolean = false, currentUserId?: string) {
    const userProfile = await this.prisma.user.findUnique({
      where: isUsername ? { username: identifier } : { id: identifier },
      select: {
        id: true,
        username: true,
        club: true,
        bio: true,
        avatar: true,
        reputation: true,
        createdAt: true,
        _count: { select: { followers: true, following: true } },
        followers: currentUserId ? { where: { id: currentUserId }, select: { id: true } } : false,
      },
    });

    if (!userProfile) throw new NotFoundException('User not found');

    const postStats = await this.prisma.post.aggregate({
      where: { authorId: userProfile.id },
      _sum: { likesCount: true, dislikesCount: true },
    });

    const isFollowing = currentUserId
      ? Array.isArray(userProfile.followers) && userProfile.followers.length > 0
      : false;
    const { followers, ...cleanProfile } = userProfile;

    return {
      ...cleanProfile,
      isFollowing,
      clout: {
        totalCooks: postStats._sum.likesCount || 0,
        totalOffsides: postStats._sum.dislikesCount || 0,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let decoded;
    try {
      decoded = this.jwtService.verify(dto.refreshToken, { secret: process.env.REFRESH_SECRET });
    } catch (err) {
      throw new ForbiddenException(err, 'Invalid Refresh Token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.refreshToken) throw new ForbiddenException('Invalid Request');

    const isMatch = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isMatch) throw new ForbiddenException('Invalid Refresh Token');

    const newAccessToken = this.jwtService.sign(
      { id: user.id, club: user.club || '', role: user.role },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );

    return { accessToken: newAccessToken };
  }

  private generateToken(userId: string, role: string) {
    const accessToken = this.jwtService.sign(
      { id: userId, role: role },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { id: userId },
      { secret: process.env.REFRESH_SECRET, expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }
}
