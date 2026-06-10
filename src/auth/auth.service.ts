import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';
import { CreateStoreOwnerDto } from './dto/create-storeowner.dto';
import { GoogleUser, UserResponseDto } from '../common/types/auth';
import { User, UserRole } from '@prisma/client';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }
  async register(data: RegisterDto): Promise<UserResponseDto> {
    const exist = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exist) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await argon2.hash(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: UserRole.CUSTOMER,
        password: hashedPassword,
      },
    });

    const { password, ...safe } = user;

    return safe;
  }

  async createStoreOwner(dto: CreateStoreOwnerDto, superadminId: string): Promise<UserResponseDto> {
    const superadmin = await this.prisma.user.findUnique({
      where: { id: superadminId },
      select: { role: true },
    });

    if (!superadmin || superadmin.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmin can create store owners');
    }

    const exist = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exist) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: UserRole.STOREOWNER,
        password: hashedPassword,
      },
    });

    if (dto.storeName) {
      const slug = dto.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await this.prisma.store.create({
        data: {
          name: dto.storeName,
          slug,
          ownerId: user.id,
        },
      });
    }

    const { password, ...safe } = user;

    return safe;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: UserResponseDto }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new BadRequestException('Invalid credentials')
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new BadRequestException('Invalid credentials');

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      jwtSecret,
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
          role: UserRole.CUSTOMER,
          password: null,
        },
      })
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        provider: 'google',
      },
      jwtSecret,
      { expiresIn: '7d' },
    )

    const { password, ...safe } = user

    return {
      token,
      user: safe,
    }
  }

  async requestResetPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new BadRequestException('Email not registered')
    }

    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt
      }
    })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetLink = `${frontendUrl}/forgot-password/reset?token=${token}`

    return {
      message: 'Reset password link generated',
      resetLink
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token')
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token expired')
    }

    const hashedPassword = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    })

    await this.prisma.passwordResetToken.delete({
      where: { token }
    })

    return {
      message: 'Password successfuly reset'
    }
  }

}
