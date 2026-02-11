import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';
import { GoogleUser, UserResponseDto } from '../common/types/auth';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }
  async register(data: RegisterDto): Promise<UserResponseDto> {
    const exist: User | null = await this.prisma?.user?.findUnique({
      where: { email: data.email },
    });

    if (exist) {
      throw new Error('Email already exists');
    }

    if (exist) throw new Error('Email already exists');

    const hashedPassword = await argon2.hash(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        password: hashedPassword,
      },
    });

    const { password, ...safe } = user;

    return safe;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: UserResponseDto }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new BadRequestException('This Account uses google sign in')
    }

    if (!user) throw new Error('Invalid credentials');

    const valid = await argon2.verify(user.password as string, password);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'SECRET',
      { expiresIn: '7d' }
    );

    const { password: _, ...safe } = user;

    return { token, user: safe, };
  }

  async logout(authHeader?: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) throw new BadRequestException('No token provided');

    await this.prisma.blacklistedToken.create({
      data: { token },
    });
    const payload = {
      message: 'Successfully logged out',
      isLoggedIn: false
    }
    return payload
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.prisma.blacklistedToken.findUnique({
      where: { token },
    });
    return !!blacklisted;
  }

  async handleGoogleLogin(googleUser: GoogleUser) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    })

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name ?? 'Google User',
          role: 'CUSTOMER',
          password: null,
        },
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        provider: 'google',
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    )

    const { password, ...safe } = user

    return {
      token,
      user: safe,
    }
  }

}
