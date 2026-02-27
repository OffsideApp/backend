// src/modules/feed/feed.service.ts
import { prisma } from "../../libs/prisma";
import { CreatePostDto, GetFeedDto } from "./feed.types";
import { AppError } from "../../utils/AppError";

export class FeedService {
  // 1. CREATE POST
  static async createPost(dto: CreatePostDto) {
    if (!dto.content) {
      throw new AppError("Post content cannot be empty", 400);
    }

    const post = await prisma.post.create({
      data: {
        content: dto.content,
        hasAudio: dto.hasAudio || false,
        audioUrl: dto.audioUrl,
        audioDuration: dto.audioDuration,
        authorId: dto.authorId,
      },
      include: {
        author: {
          select: { username: true, club: true, avatar: true },
        },
      },
    });

    return post;
  }

  // 2. GET FEED
  static async getFeed(dto: GetFeedDto) {
    const limit = dto.limit || 20;
    const offset = dto.offset || 0;

    const posts = await prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, club: true, avatar: true },
        },
      },
    });

    return posts;
  }
}