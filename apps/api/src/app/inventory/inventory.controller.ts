import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryItemResponseDto } from './dto/inventory-response.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOkResponse({ type: InventoryItemResponseDto, isArray: true })
  list() {
    return this.inventoryService.list();
  }

  @Get(':variantId')
  @ApiOkResponse({ type: InventoryItemResponseDto })
  getByVariantId(@Param('variantId') variantId: string) {
    return this.inventoryService.getByVariantId(variantId);
  }

  @Patch(':variantId')
  @ApiOkResponse({ type: InventoryItemResponseDto })
  adjust(@Param('variantId') variantId: string, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(variantId, dto.quantityChange);
  }
}
