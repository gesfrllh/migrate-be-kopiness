import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from 'src/types/auth';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
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
    if (!user) throw new Error('Invalid credentials');

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'SECRET',
    );

    const { password: _, ...safe } = user;

    return { token, user: safe };
  }

  async logout(authHeader?: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) throw new BadRequestException('No token provided');

    await this.prisma.blacklistedToken.create({
      data: { token },
    });
    return { message: 'Successfully logged out' };
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.prisma.blacklistedToken.findUnique({
      where: { token },
    });
    return !!blacklisted;
  }

}
  