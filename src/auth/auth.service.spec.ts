import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  store: {
    create: jest.fn(),
  },
  blacklistedToken: {
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('token123'),
  decode: jest.fn(),
}));

jest.mock('../utils/crypto.utils', () => ({ decryptToken: jest.fn() }));

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
        role: 'CUSTOMER',
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
        role: 'CUSTOMER',
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.login(user.email, '123456')).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('requestResetPassword', () => {
    it('does not disclose whether an account exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.requestResetPassword('missing@example.com')).resolves.toEqual({
        message: 'If an account exists, reset instructions have been sent.',
      });
    });
  });

  describe('createStoreOwner', () => {
    it('creates owner and optional store in one transaction', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: 'SUPERADMIN' })
        .mockResolvedValueOnce(null);
      mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
      mockPrisma.user.create.mockResolvedValue({
        id: 'owner-1', name: 'Owner', email: 'owner@example.com', password: 'hash', role: 'STOREOWNER',
      });

      await expect(service.createStoreOwner({
        name: 'Owner', email: 'owner@example.com', password: 'password123', storeName: 'Kopi Kita',
      }, 'admin-1')).resolves.toMatchObject({ id: 'owner-1', email: 'owner@example.com' });

      expect(mockPrisma.store.create).toHaveBeenCalledWith({
        data: { name: 'Kopi Kita', slug: 'kopi-kita', ownerId: 'owner-1' },
      });
    });
  });

  describe('blacklist', () => {
    it('upserts only unexpired tokens and removes expired entries', async () => {
      const crypto = jest.requireMock('../utils/crypto.utils');
      const jsonwebtoken = jest.requireMock('jsonwebtoken');
      crypto.decryptToken.mockReturnValue('jwt-token');
      jsonwebtoken.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });

      await service.logout('encrypted-token');
      expect(mockPrisma.blacklistedToken.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { token: 'jwt-token' },
        create: expect.objectContaining({ token: 'jwt-token' }),
      }));

      mockPrisma.blacklistedToken.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() - 1) });
      await expect(service.isBlacklisted('expired')).resolves.toBe(false);
      expect(mockPrisma.blacklistedToken.delete).toHaveBeenCalledWith({ where: { token: 'expired' } });
    });
  });

});
