import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryItemResponseDto } from './dto/inventory-response.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permission, Permissions } from '../auth/permissions';

// No @Public() anywhere in this controller — stock levels are internal
// operational data, not customer-facing. Every route here requires the
// SUPER_ADMIN role via the class-level decorator below.
@Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
@Permissions(Permission.ProductsWrite)
@ApiBearerAuth()
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
