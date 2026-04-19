import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const makeService = () => {
    const prismaService = {
      $queryRaw: jest.fn(),
    };

    return {
      prismaService,
      service: new HealthService(prismaService as never),
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok when database responds', async () => {
    const { service, prismaService } = makeService();

    prismaService.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    const result = await service.check();

    expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(typeof result.uptime).toBe('number');
  });

  it('throws service unavailable when database check fails', async () => {
    const { service, prismaService } = makeService();

    prismaService.$queryRaw.mockRejectedValueOnce(new Error('db down'));

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
