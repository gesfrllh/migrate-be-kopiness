import { HttpException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { AiController } from './ai.contoller';

describe('AiController', () => {
  const service = { adjustCoffee: jest.fn() };
  const controller = new AiController(service as any);

  afterEach(() => jest.clearAllMocks());

  it('requires JWT authentication', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AiController.prototype.coffeAssistant)).toContain(JwtGuard);
  });

  it('keeps provider HTTP errors safe', async () => {
    service.adjustCoffee.mockRejectedValue(new Error('provider secret'));

    await expect(controller.coffeAssistant({} as any)).rejects.toMatchObject({
      response: { message: 'AI provider request failed' },
      status: 500,
    });
  });

  it('preserves expected HTTP errors', async () => {
    const error = new HttpException('timeout', 504);
    service.adjustCoffee.mockRejectedValue(error);

    await expect(controller.coffeAssistant({} as any)).rejects.toBe(error);
  });
});
