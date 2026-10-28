import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CreatePlantDto, CreateQualityClaimDto } from '../dto/plant.dto';
import { MongoDispatchRepository } from '../repositories/mongo-dispatch.repository';
import type {
  SubcontractorPlant,
  QualityClaim,
} from '@ah/products/dispatch/domain';

@Controller('api/dispatch/plants')
export class DispatchPlantsController {
  constructor(private readonly repository: MongoDispatchRepository) {}

  @Get()
  async listPlants() {
    return this.repository.listPlants();
  }

  @Get(':id')
  async getPlant(@Param('id') id: string) {
    const plant = await this.repository.findPlantById(id);
    if (!plant) {
      throw new NotFoundException(`Plant ${id} not found.`);
    }
    return plant;
  }

  @Post()
  async createPlant(@Body() dto: CreatePlantDto) {
    const newId = dto.id || `plant-${Math.floor(100 + Math.random() * 899)}`;

    const newPlant: SubcontractorPlant = {
      id: newId,
      name: dto.name.trim(),
      location: dto.location.trim(),
      postalCode: dto.postalCode.trim().toUpperCase(),
      speciality: dto.speciality,
      dailyCapacityKg: dto.dailyCapacityKg,
      currentLoadKg: 0,
      activeBatchCount: 0,
      readyForPickupCount: 0,
      defectRatePct: 0.0,
      slaPunctualityPct: 100,
      contactPerson: dto.contactPerson.trim(),
      phone: dto.phone.trim(),
      email: dto.email || `info@${newId}.laundry`,
      claims: [],
    };

    return this.repository.createPlant(newPlant);
  }

  @Post(':id/claims')
  async logClaim(
    @Param('id') plantId: string,
    @Body() dto: CreateQualityClaimDto,
  ) {
    const plant = await this.repository.findPlantById(plantId);
    if (!plant) {
      throw new NotFoundException(`Plant ${plantId} not found.`);
    }

    const claimId = `CLM-${Math.floor(400 + Math.random() * 599)}`;
    const costPerItem: Record<string, number> = {
      stain_rewash: 1.5,
      torn_damaged: 18.0,
      missing_count: 22.0,
      creased_press: 2.0,
    };
    const creditAmount = dto.count * (costPerItem[dto.type] || 5.0);

    const newClaim: QualityClaim = {
      id: claimId,
      orderId: dto.orderId || 'ORD-DISPUTED',
      clientName: dto.clientName,
      plantId,
      type: dto.type,
      itemSku: dto.itemSku,
      itemName: `${dto.itemSku} - Defect Reported`,
      count: dto.count,
      creditAmountGbp: creditAmount,
      status: 'pending',
      loggedAt: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updated = await this.repository.addPlantClaim(plantId, newClaim);
    return {
      success: true,
      claim: newClaim,
      plant: updated,
    };
  }

  @Delete(':id')
  async deletePlant(@Param('id') id: string) {
    const deleted = await this.repository.deletePlant(id);
    if (!deleted) {
      throw new NotFoundException(`Plant ${id} not found.`);
    }
    return { success: true, deletedId: id };
  }
}
