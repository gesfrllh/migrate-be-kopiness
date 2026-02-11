import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../auth/auth.service';
import { Request } from 'express';
import { decryptToken } from '../../utils/crypto.utils';
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const encryptedToken = req.cookies?.access_token;
    if (!encryptedToken) {
      throw new UnauthorizedException('No token provided');
    }

    const token = decryptToken(encryptedToken);
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }
    const isBlacklisted = await this.authService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
