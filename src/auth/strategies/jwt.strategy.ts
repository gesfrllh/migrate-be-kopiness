import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { Injectable } from '@nestjs/common'
import { decryptToken, encryptToken } from '../../utils/crypto.utils'
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          return decryptToken(req?.cookies?.access_token)
        },
      ]),
      secretOrKey: process.env.JWT_SECRET,
    })
  }

  async validate(payload: any) {
    return payload
  }
}
