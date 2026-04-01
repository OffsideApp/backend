/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegisterDto, VerifyEmailDto, LoginDto, RefreshTokenDto } from './auth.types';

// Tells TS what 'req.user' looks like
interface AuthRequest extends Request {
  user: { id: string; role: string };
}

@Controller('auth') // 🚀 Maps all routes to /auth/...
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // --- PUBLIC ROUTES ---

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return { success: true, message: result.message, data: result }; // NestJS auto-sends 201 Created!
  }

  @Post('verify')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return { success: true, message: result.message };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return { success: true, message: 'Login successful', data: result };
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto);
    return { success: true, data: result };
  }

  // --- PROTECTED ROUTES (Requires JwtAuthGuard) ---

  @UseGuards(JwtAuthGuard)
  @Post('set-profile')
  async setProfile(@Req() req: AuthRequest, @Body() body: { username: string; bio?: string }) {
    const updatedUser = await this.authService.setProfile({
      userId: req.user.id,
      username: body.username,
      bio: body.bio,
    });
    return {
      success: true,
      message: `Profile updated! Hello @${updatedUser.username}`,
      data: { username: updatedUser.username, bio: updatedUser.bio },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('select-club')
  async selectClub(@Req() req: AuthRequest, @Body() body: { clubName: string }) {
    const updatedUser = await this.authService.selectClub({
      userId: req.user.id,
      clubName: body.clubName,
    });
    return {
      success: true,
      message: `Welcome to ${updatedUser.club}!`,
      data: { club: updatedUser.club },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar')) // 🚀 NestJS native Multer implementation!
  async uploadAvatar(@Req() req: AuthRequest, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Please provide an image file');

    const avatarUrl = await this.cloudinaryService.uploadImage(file);
    const updatedUser = await this.authService.updateAvatar(req.user.id, avatarUrl);

    return {
      success: true,
      message: 'Avatar updated successfully!',
      data: { avatar: updatedUser.avatar },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow')
  async toggleFollow(@Req() req: AuthRequest, @Body() body: { targetUserId: string }) {
    if (!body.targetUserId) throw new BadRequestException('Target User ID is required');

    const result = await this.authService.toggleFollow(req.user.id, body.targetUserId);
    return { success: true, message: result.message };
  }

  // 🚀 Replaces both router.get('/profile') AND router.get('/profile/:username')
  @UseGuards(JwtAuthGuard)
  @Get(['profile', 'profile/:username'])
  async getProfile(@Req() req: AuthRequest, @Param('username') username?: string) {
    const currentUserId = req.user.id;
    let profileData;

    if (username) {
      profileData = await this.authService.getProfile(username, true, currentUserId);
    } else {
      profileData = await this.authService.getProfile(currentUserId, false, currentUserId);
    }

    return { success: true, data: profileData };
  }
}
