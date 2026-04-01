/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCommentDto, CreatePostDto, GetFeedDto, InteractDto } from './feed.types';
import { InteractionType } from '../../generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREATE POST
  async createPost(dto: CreatePostDto) {
    if (!dto.content && !dto.hasAudio && !dto.hasImage) {
      throw new BadRequestException('Post must contain text, an audio rant, or an image');
    }

    return await this.prisma.post.create({
      data: {
        content: dto.content,
        hasAudio: dto.hasAudio || false,
        audioUrl: dto.audioUrl,
        audioDuration: dto.audioDuration,
        authorId: dto.authorId,
        hasImage: dto.hasImage || false,
        imageUrl: dto.imageUrl,
      },
      include: {
        author: {
          select: { username: true, club: true, avatar: true },
        },
      },
    });
  }

  // 2. GET FEED
  async getFeed(dto: GetFeedDto) {
    const limit = dto.limit ? Number(dto.limit) : 20;
    const offset = dto.offset ? Number(dto.offset) : 0;

    const filter = dto.club ? { author: { club: dto.club } } : {};

    return await this.prisma.post.findMany({
      where: filter,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, club: true, avatar: true },
        },
      },
    });
  }

  // 3. GET SINGLE POST
  async getPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { username: true, club: true, avatar: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { username: true, club: true, avatar: true } },
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  // 4. CREATE COMMENT
  async createComment(dto: CreateCommentDto) {
    if (!dto.content && !dto.hasAudio && !dto.hasImage) {
      throw new BadRequestException('Comment must contain text, an audio rant, or an image');
    }

    const postExists = await this.prisma.post.findUnique({ where: { id: dto.postId } });
    if (!postExists)
      throw new NotFoundException('The post you are trying to reply to does not exist');

    return await this.prisma.comment.create({
      data: {
        content: dto.content || '',
        hasAudio: dto.hasAudio || false,
        audioUrl: dto.audioUrl,
        audioDuration: dto.audioDuration,
        hasImage: dto.hasImage || false,
        imageUrl: dto.imageUrl,
        postId: dto.postId,
        authorId: dto.authorId,
      },
      include: {
        author: { select: { username: true, club: true, avatar: true } },
      },
    });
  }

  // 5. INTERACT (COOK / OFFSIDE)
  async interactWithPost(dto: InteractDto) {
    const { userId, postId, action } = dto;

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existingInteraction = await this.prisma.interaction.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingInteraction) {
      if (existingInteraction.type === action) {
        // Toggle Off
        await this.prisma.interaction.delete({ where: { id: existingInteraction.id } });
        await this.prisma.post.update({
          where: { id: postId },
          data:
            action === InteractionType.COOK
              ? { likesCount: { decrement: 1 } }
              : { dislikesCount: { decrement: 1 } },
        });
        return { message: `Removed ${action}` };
      } else {
        // Switch Vote
        await this.prisma.interaction.update({
          where: { id: existingInteraction.id },
          data: { type: action },
        });
        await this.prisma.post.update({
          where: { id: postId },
          data:
            action === InteractionType.COOK
              ? { likesCount: { increment: 1 }, dislikesCount: { decrement: 1 } }
              : { dislikesCount: { increment: 1 }, likesCount: { decrement: 1 } },
        });
        return { message: `Switched vote to ${action}` };
      }
    } else {
      // New Vote
      await this.prisma.interaction.create({
        data: { userId, postId, type: action },
      });
      await this.prisma.post.update({
        where: { id: postId },
        data:
          action === InteractionType.COOK
            ? { likesCount: { increment: 1 } }
            : { dislikesCount: { increment: 1 } },
      });
      return { message: `Successfully added ${action}` };
    }
  }
}
