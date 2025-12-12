import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  blacklistedToken: {
    create: jest.fn(),
  },
};

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('token123'),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const dto: RegisterDto = {
        name: 'John',
        email: 'john@example.com',
        password: '123456',
        role: UserRole.CUSTOMER,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation((data) => ({
        id: '1',
        ...data.data,
      }));

      const result = await service.register(dto);

      expect(result).toHaveProperty('id');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(result.password).toBeUndefined();
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'john@example.com',
      });

      await expect(
        service.register({
          name: 'John',
          email: 'john@example.com',
          password: '123456',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should login and return token + user', async () => {
      const password = '123456';
      const hashedPassword = await argon2.hash(password);

      const user = {
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.login(user.email, password);

      expect(result).toHaveProperty('token', 'token123');
      expect(result.user).toHaveProperty('email', user.email);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(result.user.password).toBeUndefined(); // safeUser
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('noone@example.com', '123456'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password invalid', async () => {
      const user = {
        id: '1',
        email: 'john@example.com',
        password: await argon2.hash('wrong'),
        name: 'John',
        role: UserRole.CUSTOMER,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.login(user.email, '123456')).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('logout', () => {
    it('should throw if no token provided', async () => {
      await expect(service.logout()).rejects.toThrow('No token provided');
    });

    it('should logout successfully if token provided', async () => {
      mockPrisma.blacklistedToken.create.mockResolvedValue({ token: 'abc' });

      const result = await service.logout('Bearer abc');

      expect(result).toEqual({ message: 'Successfully logged out' });
      expect(mockPrisma.blacklistedToken.create).toHaveBeenCalledWith({
        data: { token: 'abc' },
      });
    });
  });

});
