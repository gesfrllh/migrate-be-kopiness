import { GatewayTimeoutException } from '@nestjs/common';
import { AiService } from './ai.service';

describe('AiService', () => {
  const environment = process.env;

  beforeEach(() => {
    process.env = {
      ...environment,
      AI_BASE_URL: 'https://ai.example.test',
      AI_API_KEY: 'key',
      AI_MODEL: 'model',
      AI_TIMEOUT_MS: '1',
    };
  });

  afterEach(() => {
    process.env = environment;
    jest.restoreAllMocks();
  });

  it('maps aborted provider requests to 504 without retrying', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));

    await expect((new AiService() as any).generateWithRetry('prompt')).rejects.toBeInstanceOf(GatewayTimeoutException);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
