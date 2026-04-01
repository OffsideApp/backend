/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/feed/feed.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { FeedService } from './feed.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard'; // Adjust path
import { InteractionType } from '../../generated/prisma/client';

// Keep typescript happy
interface AuthRequest extends Request {
  user: { id: string; role: string };
}

@UseGuards(JwtAuthGuard) // 🚀 Protects EVERY route in this controller!
@Controller('feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // 1. CREATE POST
  @Post('create-post')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'audioFile', maxCount: 1 },
        { name: 'imageFile', maxCount: 1 },
      ],
      {
        limits: { fileSize: 10 * 1024 * 1024 }, // 🚀 Native Multer 10MB limit!
      },
    ),
  )
  async createPost(
    @Req() req: AuthRequest,
    @Body() body: { content?: string; audioDuration?: string },
    @UploadedFiles()
    files: { audioFile?: Express.Multer.File[]; imageFile?: Express.Multer.File[] },
  ) {
    const audioFile = files?.audioFile?.[0];
    const imageFile = files?.imageFile?.[0];

    let finalAudioUrl;
    let finalImageUrl;

    if (audioFile) finalAudioUrl = await this.cloudinaryService.uploadAudio(audioFile);
    if (imageFile) finalImageUrl = await this.cloudinaryService.uploadImage(imageFile);

    const result = await this.feedService.createPost({
      authorId: req.user.id,
      content: body.content || '',
      hasAudio: !!audioFile,
      audioUrl: finalAudioUrl,
      audioDuration: body.audioDuration,
      hasImage: !!imageFile,
      imageUrl: finalImageUrl,
    });

    return { success: true, message: 'Post created successfully', data: result };
  }

  // 2. GET FEED
  @Get('get-feed')
  async getFeed(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const posts = await this.feedService.getFeed({
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return { success: true, results: posts.length, data: posts };
  }

  // 3. GET SINGLE POST
  @Get('get-post/:postId')
  async getPost(@Param('postId') postId: string) {
    if (!postId) throw new BadRequestException('Post ID is required');

    const result = await this.feedService.getPost(postId);
    return { success: true, data: result };
  }

  // 4. CREATE COMMENT
  @Post('comment')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'audioFile', maxCount: 1 },
        { name: 'imageFile', maxCount: 1 },
      ],
      { limits: { fileSize: 10 * 1024 * 1024 } },
    ),
  )
  async createComment(
    @Req() req: AuthRequest,
    @Body() body: { postId: string; content?: string; audioDuration?: string },
    @UploadedFiles()
    files: { audioFile?: Express.Multer.File[]; imageFile?: Express.Multer.File[] },
  ) {
    if (!body.postId) throw new BadRequestException('postId is required');

    const audioFile = files?.audioFile?.[0];
    const imageFile = files?.imageFile?.[0];

    let finalAudioUrl;
    let finalImageUrl;

    if (audioFile) finalAudioUrl = await this.cloudinaryService.uploadAudio(audioFile);
    if (imageFile) finalImageUrl = await this.cloudinaryService.uploadImage(imageFile);

    const result = await this.feedService.createComment({
      postId: body.postId,
      authorId: req.user.id,
      content: body.content,
      hasAudio: !!audioFile,
      audioUrl: finalAudioUrl,
      audioDuration: body.audioDuration,
      hasImage: !!imageFile,
      imageUrl: finalImageUrl,
    });

    return { success: true, message: 'Comment posted successfully', data: result };
  }

  // 5. INTERACT (COOK / OFFSIDE)
  @Post('interact')
  async interact(@Req() req: AuthRequest, @Body() body: { postId: string; action: string }) {
    if (!body.postId || !body.action) {
      throw new BadRequestException('Post ID and action are required');
    }

    // Strict Validation
    if (!Object.values(InteractionType).includes(body.action as InteractionType)) {
      throw new BadRequestException('Invalid action. Use either COOK or OFFSIDE');
    }

    const result = await this.feedService.interactWithPost({
      userId: req.user.id,
      postId: body.postId,
      action: body.action as InteractionType,
    });

    return { success: true, message: result.message };
  }
}
