// src/modules/feed/feed.route.ts
import { Router } from 'express';
import { FeedController } from './feed.controller';
import { protect } from '../../middleware/auth.middleware'; // Adjust path if needed

const router = Router();

// Protect all feed routes (User must be logged in)
router.use(protect);


router.post('/create-post', FeedController.createPost);
router.get('/get-feed', FeedController.getFeed);


export default router;
