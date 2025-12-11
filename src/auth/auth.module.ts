import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import JwtBlacklistGuard from 'src/common/guards/jwt-blacklist.guard';


@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, JwtBlacklistGuard],
})
export class AuthModule {}
  