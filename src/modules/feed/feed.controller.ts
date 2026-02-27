// src/modules/feed/feed.controller.ts
import { Request, Response, NextFunction } from 'express';
import { FeedService } from './feed.service';
import { catchAsync } from '../../utils/catchAsync';

export class FeedController {

  // 1. CREATE POST
  static createPost = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authorId = req.user!.id; 
    const { content, hasAudio, audioUrl, audioDuration } = req.body;
    
    const result = await FeedService.createPost({
      authorId,
      content, hasAudio, audioUrl, audioDuration
    });

    res.status(201).json({ 
      success: true, 
      message: 'Post created successfully', 
      data: result 
    });
  });

    
  // 2. GET FEED
  static getFeed = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const posts = await FeedService.getFeed({ limit, offset });
    
    res.status(200).json({ 
      success: true, 
      results: posts.length, 
      data: posts 
    });
  });
}