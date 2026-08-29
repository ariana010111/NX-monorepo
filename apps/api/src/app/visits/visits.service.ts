import { Injectable, Logger } from '@nestjs/common';
import { VisitsRepository } from './visits.repository';
import { RecordVisitDto } from './dto/record-visit.dto';

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  constructor(private readonly visitsRepo: VisitsRepository) {}

  /**
   * Records a single storefront page visit.
   * userId is optional — guest visits are tracked by sessionId only.
   * ip is extracted from the request by the controller; the repository hashes
   * it to SHA-256 before persistence so no PII is stored.
   */
  record(dto: RecordVisitDto, userId?: string, ip?: string) {
    this.logger.log(`record path=${dto.path} userId=${userId ?? 'guest'} session=${dto.sessionId ?? '-'}`);
    return this.visitsRepo.record({
      path: dto.path,
      userId,
      productId: dto.productId,
      sessionId: dto.sessionId,
      referrer: dto.referrer,
      userAgent: dto.userAgent,
      ip,
    });
  }
}
