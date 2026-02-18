import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';

export class AuthController {
  
  // 1. REGISTER
  static register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.register(req.body);
    res.status(201).json({ success: true, message: result.message, data: result });
  });

  // 2. VERIFY EMAIL
  static verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.verifyEmail(req.body);
    res.status(200).json({ success: true, message: result.message });
  });

  // 3. LOGIN
  static login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);
    res.status(200).json({ success: true, message: 'Login successful', data: result });
  });

  // 4. SET PROFILE (Username + Bio)
  static setProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // const userId = req.user!.id; 
    // const { username, bio } = req.body; // Expecting Bio here too

    const updatedUser = await AuthService.setProfile(req.body);

    res.status(200).json({
      success: true,
      message: `Profile updated! Hello @${updatedUser.username}`,
      data: { username: updatedUser.username, bio: updatedUser.bio }
    });
  });

  // 5. SELECT CLUB
  static selectClub = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id; 
    const { club } = req.body;

    const updatedUser = await AuthService.selectClub(userId, club);
    
    res.status(200).json({
      success: true,
      message: `Welcome to ${updatedUser.club}!`,
      data: { club: updatedUser.club }
    });
  });

  
  // 6. REFRESH TOKEN
  static refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
       return next(new AppError("Refresh Token is required", 400));
    }

    const result = await AuthService.refreshToken({ refreshToken });

    res.status(200).json({
      success: true,
      data: result
    });
  });
}

