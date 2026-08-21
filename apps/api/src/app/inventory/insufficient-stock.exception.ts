import { BadRequestException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
  constructor(variantId: string, requested: number, available: number) {
    super(`Insufficient stock for variant "${variantId}": requested ${requested}, only ${available} available`);
  }
}
