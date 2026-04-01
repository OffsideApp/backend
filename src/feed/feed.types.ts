// src/modules/feed/feed.types.ts
import { InteractionType } from '../../generated/prisma/client';

export interface CreatePostDto {
  authorId: string;
  content: string;
  hasAudio?: boolean;
  audioUrl?: string | null;
  audioDuration?: string;
  hasImage?: boolean;
  imageUrl?: string | null;
}

export interface GetFeedDto {
  limit?: number;
  offset?: number;
  club?: string;
}

export interface CreateCommentDto {
  postId: string;
  authorId: string;
  content?: string;
  hasAudio?: boolean;
  audioUrl?: string | null;
  audioDuration?: string;
  hasImage?: boolean;
  imageUrl?: string | null;
}

export interface InteractDto {
  userId: string;
  postId: string;
  action: InteractionType;
}
