import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt'
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor (
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}
   async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization

    if(!authHeader) {
      throw new UnauthorizedException('No Token Provided')
    }

    const token = authHeader.split(' ')[1]
    if(!token) {
      throw new UnauthorizedException('Invalid Authorization header')
    }

    const isBlacklisted = await this.authService.isBlacklisted(token)
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted')
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      })

      req.user = payload
    } catch(err) {
      throw new UnauthorizedException('Invalid or expired Token')
    }
    return true;
  }
}