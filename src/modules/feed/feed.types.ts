// src/modules/feed/feed.types.ts

export interface CreatePostDto {
  authorId: string;
  content: string;
  hasAudio?: boolean;
  audioUrl?: string;
  audioDuration?: string;
}

export interface GetFeedDto {
  limit?: number;
  offset?: number;
}