/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'prisma/prisma.service';

// Create a custom Request type so TS knows 'user' is allowed
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 🚀 4. Explicitly type the request as our AuthRequest
    const request = context.switchToHttp().getRequest<AuthRequest>();

    // request.headers.authorization is now strictly typed as string | undefined
    const authHeader = request.headers.authorization;

    // 1. Check for Authorization Header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Not authorized, no token');
    }

    const token = authHeader.split(' ')[1]; // Strictly typed as string

    try {
      // 2. Verify Token and cast it to our JwtPayload interface
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'default_secret',
      });

      // 3. ROBUST CHECK: Does this user still exist?
      const currentUser = await this.prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, role: true, isVerified: true },
      });

      if (!currentUser) {
        throw new UnauthorizedException('The user belonging to this token no longer exists.');
      }

      // 4. Attach User to Request Object
      request.user = {
        id: currentUser.id,
        role: currentUser.role,
      };

      return true; // Move to the next middleware/controller
    } catch (error: unknown) {
      // 🚀 5. Type error as 'unknown' instead of 'any'
      if (error instanceof UnauthorizedException) {
        throw error; // Preserve our custom error messages
      }
      throw new UnauthorizedException('Not authorized, token failed');
    }
  }
}
