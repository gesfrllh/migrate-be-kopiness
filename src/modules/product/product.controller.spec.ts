// src/product/product.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProductService = {
    create: jest.fn(),
    findAll: jest.fn(),
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
      imports: [
        PrismaModule,
        AuthModule
      ]
    }).compile();
 
    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
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

    const req = { user: { id: 'user-1' } };

    await controller.create(dto as any, req as any);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('should call service.findAll', async () => {
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should call service.findOne', async () => {
    await controller.findOne('abc');
    expect(service.findOne).toHaveBeenCalledWith('abc');
  });

  it('should call service.update', async () => {
    const dto = { name: 'Updated' };
    await controller.update('abc', dto);
    expect(service.update).toHaveBeenCalledWith('abc', dto);
  });

  it('should call service.remove', async () => {
    await controller.remove('abc');
    expect(service.remove).toHaveBeenCalledWith('abc');
  });
});
