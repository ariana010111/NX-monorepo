import { Test } from '@nestjs/testing';
import { VisitsService } from './visits.service';
import { VisitsRepository } from './visits.repository';
import { VisitResponseDto } from './dto/visit-response.dto';

const sampleVisit: VisitResponseDto = {
  id: 'vis-1',
  userId: null,
  sessionId: 'sess_abc',
  productId: null,
  path: '/products/rose-serum',
  referrer: null,
  createdAt: '2026-08-28T10:00:00.000Z',
};

describe('VisitsService', () => {
  let service: VisitsService;
  let repo: jest.Mocked<VisitsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VisitsService,
        {
          provide: VisitsRepository,
          useValue: { record: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(VisitsService);
    repo = module.get(VisitsRepository);
  });

  describe('record', () => {
    it('delegates to the repository with the expected input shape', async () => {
      repo.record.mockResolvedValue(sampleVisit);
      const dto = { path: '/products/rose-serum', sessionId: 'sess_abc' };
      await service.record(dto, 'user-1', '127.0.0.1');
      expect(repo.record).toHaveBeenCalledWith({
        path: '/products/rose-serum',
        userId: 'user-1',
        productId: undefined,
        sessionId: 'sess_abc',
        referrer: undefined,
        userAgent: undefined,
        ip: '127.0.0.1',
      });
    });

    it('passes userId as undefined for a guest visit (no token)', async () => {
      repo.record.mockResolvedValue(sampleVisit);
      await service.record({ path: '/home' }, undefined, undefined);
      expect(repo.record).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined }),
      );
    });

    it('returns the visit DTO from the repository', async () => {
      repo.record.mockResolvedValue(sampleVisit);
      const result = await service.record({ path: '/home' });
      expect(result).toBe(sampleVisit);
    });
  });
});
