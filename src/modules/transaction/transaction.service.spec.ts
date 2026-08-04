import { BadRequestException } from '@nestjs/common';
import { TransactionService } from './transaction.service';

describe('TransactionService checkout', () => {
  it('rejects cart items from different stores before creating an order', async () => {
    const prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'coffee-1', name: 'Coffee 1', price: 10000, stock: 5, storeId: 'store-1' },
          { id: 'coffee-2', name: 'Coffee 2', price: 12000, stock: 5, storeId: 'store-2' },
        ]),
      },
      orderSequence: { upsert: jest.fn().mockResolvedValue({ value: 1 }) },
      $transaction: jest.fn(),
    };
    const service = new TransactionService(prisma as any, {} as any);

    await expect(service.createFromCart('customer-1', {
      items: [{ productId: 'coffee-1', quantity: 1 }, { productId: 'coffee-2', quantity: 1 }],
      deliveryAddress: 'Jl. Kopi', deliveryLatitude: -6.2, deliveryLongitude: 106.8,
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
