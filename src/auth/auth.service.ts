import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';
import { CreateStoreOwnerDto } from './dto/create-storeowner.dto';
import { GoogleUser, UserResponseDto } from '../common/types/auth';
import { User, UserRole } from '@prisma/client';
import { CreateCourierDto } from './dto/create-courier.dto';
import { createHash, randomBytes } from 'node:crypto';
import { decryptToken } from 'src/utils/crypto.utils';

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

    const user = await this.prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          role: UserRole.STOREOWNER,
          password: hashedPassword,
        },
      });

      if (!dto.storeName) return owner;

      const slug = dto.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await tx.store.create({
        data: {
          name: dto.storeName,
          slug,
          ownerId: owner.id,
        },
      });
      return owner;
    });

    const { password, ...safe } = user;

    return safe;
  }

  async getUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    return users.map(({ password, ...user }) => user);
  }

  async getCouriers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: { role: UserRole.COURIER },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    })
    return users
  }

  async createCourier(dto: CreateCourierDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new BadRequestException('Email already registered')

    const password = await argon2.hash(dto.password)
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password, role: UserRole.COURIER },
    })
    const { password: _, ...safe } = user
    return safe
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

  async logout(encryptedToken: string) {
    const token = decryptToken(encryptedToken);
    if (!token) return;

    const decoded = jwt.decode(token);
    const expiresAt = typeof decoded === 'object' && decoded?.exp
      ? new Date(decoded.exp * 1000)
      : null;
    if (!expiresAt || expiresAt <= new Date()) return;

    await this.prisma.blacklistedToken.upsert({
      where: { token },
      update: { expiresAt },
      create: { token, expiresAt },
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
      select: { expiresAt: true },
    });
    if (!blacklisted) return false;
    if (blacklisted.expiresAt > new Date()) return true;
    await this.prisma.blacklistedToken.delete({ where: { token } });
    return false;
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
      return { message: 'If an account exists, reset instructions have been sent.' }
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await this.prisma.passwordResetToken.deleteMany({ where: { email } });
    await this.prisma.passwordResetToken.create({
      data: {
        token: tokenHash,
        email,
        expiresAt
      }
    })

    if (process.env.NODE_ENV !== 'production') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.info(`Password reset link for ${email}: ${frontendUrl}/forgot-password/reset?token=${token}`);
    }

    // ponytail: production email delivery needs provider integration before enabling reset links.
    return { message: 'If an account exists, reset instructions have been sent.' }
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash }
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
      where: { token: tokenHash }
    })

    return {
      message: 'Password successfuly reset'
    }
  }

}
