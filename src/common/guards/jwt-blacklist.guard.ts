import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export default class JwtBlacklistGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token provided');

    const isBlacklisted = await this.authService.isBlacklisted(token);

    if(isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted');
    }
    return true;
  }
}