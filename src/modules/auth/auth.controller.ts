import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { catchAsync } from '../../utils/catchAsync';

export class AuthController {
  //1. Register User
  static register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  //2. Verify Email
  static verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.verifyEmail(req.body);
    
    res.status(200).json({
      success: true,
      message: result.message,
      token: result.token
    });
  });

  // 3. Login
  static login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  // 4. Select Club
  static selectClub = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // req.user is guaranteed by the 'protect' middleware
    // We use the exclamation mark (!) because TypeScript might complain it's undefined
    const userId = req.user!.id; 
    const { club } = req.body;

    const updatedUser = await AuthService.selectClub(userId, club);
    
    res.status(200).json({
      success: true,
      message: `Welcome to ${updatedUser.club}!`,
      data: { club: updatedUser.club }
    });
  });
}