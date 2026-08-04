import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProductService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: jest.fn() })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn() })
      .compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create', async () => {
    const dto = {
      name: 'Test',
      description: 'Desc',
      origin: 'ID',
      roastLevel: 'LIGHT',
      process: 'Washed',
      flavorNotes: 'Cocoa',
      price: 30000,
      stock: 12,
    };

    const req = { user: { id: 'user-1', role: 'STOREOWNER' } };

    await controller.create(dto as any, req as any);

    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('should call service.findAllByUser with pagination', async () => {
    mockProductService.findAllByUser.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    const user = { id: 'user-1', role: 'STOREOWNER' };
    const query = { page: 1, limit: 10, search: '' };

    await controller.findAll(user as any, query as any);

    expect(service.findAllByUser).toHaveBeenCalledWith(
      'user-1',
      'STOREOWNER',
      1,
      10,
      '',
    );
  });

  it('should call service.findOne', async () => {
    await controller.findOne('abc');
    expect(service.findOne).toHaveBeenCalledWith('abc');
  });

  it('should call service.update', async () => {
    const dto = { name: 'Updated' };
    await controller.update('abc', dto as any, { user: { id: 'user-1' } });
    expect(service.update).toHaveBeenCalledWith('abc', dto, 'user-1');
  });

  it('should call service.remove', async () => {
    await controller.remove('abc', { user: { id: 'user-1' } });
    expect(service.remove).toHaveBeenCalledWith('abc', 'user-1');
  });
});
