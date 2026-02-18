import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { Prisma } from '../generated/prisma/client';

export const globalErrorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  
  // Default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // ------------------------------------------
  // 🛡️ CUSTOM ERROR HANDLING LOGIC
  // ------------------------------------------

  // 1. Handle Prisma Unique Constraint Violations (e.g. Duplicate Email)
  // Code P2002 means "Unique constraint failed"
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[]) || ['field'];
      const message = `Duplicate value for field: ${fields.join(', ')}. Please use another value.`;
      err = new AppError(message, 400);
    }
  }

  // 2. Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    err = new AppError('Your token has expired. Please log in again.', 401);
  }

  // ------------------------------------------
  // 📤 SEND RESPONSE
  // ------------------------------------------
  
  // Development: Send full stack trace
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  
  // Production: Don't leak stack traces to users
  else {
    // Trusted Operational Error? Send message to client.
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    } 
    // Programming or Unknown Error? Don't leak details.
    else {
      console.error('ERROR 💥', err); // Log to server console
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  }
};