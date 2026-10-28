import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateStockDto, UpdateStockQuantityDto } from '../dto/stock.dto';
import { MongoDispatchRepository } from '../repositories/mongo-dispatch.repository';
import type { LinenSKU } from '@ah/products/dispatch/domain';

@Controller('api/dispatch/stock')
export class DispatchStockController {
  constructor(private readonly repository: MongoDispatchRepository) {}

  @Get()
  async listStock() {
    return this.repository.listStock();
  }

  @Post()
  async createStock(@Body() dto: CreateStockDto) {
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem: LinenSKU = {
      sku: dto.sku.trim().toUpperCase(),
      name: dto.name.trim(),
      category: dto.category,
      unitWeightGrams: dto.unitWeightGrams,
      inCleanReserve: dto.inCleanReserve,
      inCirculation: dto.inCirculation || 0,
      atPlantWash: dto.atPlantWash || 0,
      damagedScrap: 0,
      disputedMissing: 0,
      minThreshold: dto.minThreshold,
      replacementCostGbp: dto.replacementCostGbp,
      lastUpdated: nowHhMm,
    };

    return this.repository.createStock(newItem);
  }

  @Patch(':sku/quantity')
  async adjustQuantity(
    @Param('sku') sku: string,
    @Body() dto: UpdateStockQuantityDto,
  ) {
    const existing = await this.repository.findStockBySku(sku);
    if (!existing) {
      throw new NotFoundException(`SKU ${sku} not found.`);
    }

    const currentVal = existing[dto.field] || 0;
    const nextVal = Math.max(0, currentVal + dto.delta);
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updated = await this.repository.updateStock(sku, {
      [dto.field]: nextVal,
      lastUpdated: nowHhMm,
    });

    return updated;
  }

  @Delete(':sku')
  async deleteStock(@Param('sku') sku: string) {
    const deleted = await this.repository.deleteStock(sku);
    if (!deleted) {
      throw new NotFoundException(`SKU ${sku} not found.`);
    }
    return { success: true, deletedSku: sku };
  }
}
