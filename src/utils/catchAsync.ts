import { Request, Response, NextFunction } from 'express';

// This function catches any error in your controller and passes it to the Global Error Handler
export const catchAsync = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};