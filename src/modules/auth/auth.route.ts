import { Router } from 'express';
import { AuthController } from './auth.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

// --- PUBLIC ROUTES ---
router.post('/register', AuthController.register);
router.post('/verify',   AuthController.verifyEmail);
router.post('/login',    AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// --- PROTECTED ROUTES ---
router.post('/set-profile', protect, AuthController.setProfile); 
router.post('/select-club', protect, AuthController.selectClub);

export default router;