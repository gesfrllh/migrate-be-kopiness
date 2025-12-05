import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call AuthService.register', async () => {
      const dto: RegisterDto = {
        name: 'John',
        email: 'john@example.com',
        password: '123456',
        role: UserRole.CUSTOMER,
      };

      mockAuthService.register.mockResolvedValue({
        id: '1',
        name: dto.name,
        email: dto.email,
        role: dto.role,
      });

      const result = await controller.register(dto);

      expect(result).toHaveProperty('id');
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });
});
