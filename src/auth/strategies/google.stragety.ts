import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config';
import type { ConfigType } from '@nestjs/config';
import { profile } from 'console';


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfiguration: ConfigType<typeof googleOauthConfig>
  ) {
    super({
      clientID: googleConfiguration.clientId!,
      clientSecret: googleConfiguration.clientSecret!,
      callbackURL: googleConfiguration.callbackURL!,
      scope: ["email", "profile"]
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const { id, emails, displayName } = profile;

    return {
      providerId: id,
      email: emails?.[0]?.value,
      name: displayName,
    };
  }
}