import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import JwtBlacklistGuard from '../common/guards/jwt-blacklist.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import googleOauthConfig from './config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.stragety';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ConfigModule.forFeature(googleOauthConfig)
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtBlacklistGuard, GoogleStrategy, JwtStrategy],
  exports: [
    AuthService,
    JwtModule,
    JwtBlacklistGuard
  ],
})
export class AuthModule { }
