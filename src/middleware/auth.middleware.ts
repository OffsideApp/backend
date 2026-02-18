import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from "../libs/prisma";
import { ROLE } from '../../src/generated/prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Interface for the decoded token payload
interface DecodedToken {
  id: string;
  role: ROLE;
  iat: number;
  exp: number;
}

/**
 * 🛡️ Protect: Verifies the JWT Token
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // 1. Check for Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get the token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify Token
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

      // 3. ROBUST CHECK: Does this user still exist?
      // (This handles cases where a user is deleted but token is still valid)
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true,  role: true, isVerified: true } // Fetch only needed fields
      });

      if (!currentUser) {
        return res.status(401).json({ 
          success: false, 
          message: 'The user belonging to this token no longer exists.' 
        });
      }

      // 4. Attach User to Request Object
      req.user = {
        id: currentUser.id,
        role: currentUser.role
      };

      next(); // Move to the next middleware/controller

    } catch (error) {
      console.error('Auth Error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }
};

/**
 * 👑 Authorize: Restricts access to specific roles (e.g., ADMIN)
 */
export const authorize = (...roles: ROLE[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user?.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};