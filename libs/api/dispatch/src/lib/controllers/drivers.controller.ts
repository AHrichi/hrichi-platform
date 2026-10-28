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
import {
  CreateDriverDto,
  UpdateDriverStatusDto,
  ReassignStopsDto,
} from '../dto/driver.dto';
import { MongoDispatchRepository } from '../repositories/mongo-dispatch.repository';
import type { Driver } from '@ah/products/dispatch/domain';

@Controller('api/dispatch/drivers')
export class DispatchDriversController {
  constructor(private readonly repository: MongoDispatchRepository) {}

  @Get()
  async listDrivers() {
    return this.repository.listDrivers();
  }

  @Get(':id')
  async getDriver(@Param('id') id: string) {
    const driver = await this.repository.findDriverById(id);
    if (!driver) {
      throw new NotFoundException(`Driver ${id} not found.`);
    }
    return driver;
  }

  @Post()
  async createDriver(@Body() dto: CreateDriverDto) {
    const newId = dto.id || `DRV-${Math.floor(10 + Math.random() * 89)}`;

    const newDriver: Driver = {
      id: newId,
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      vehicle: dto.vehicle.trim(),
      registration: dto.registration.trim().toUpperCase(),
      zone: dto.zone.trim(),
      status: dto.status || 'idle',
      activeShift: dto.activeShift,
      currentLocation: dto.currentLocation.trim(),
      assignedOrderIds: [],
      completedOrderIds: [],
      stops: [],
      etaNextStop: null,
      incidentNotice: null,
      capacityKg: dto.capacityKg,
      currentPayloadKg: 0,
    };

    return this.repository.createDriver(newDriver);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDriverStatusDto,
  ) {
    const patch: Partial<Driver> = {
      status: dto.status,
      ...(dto.currentLocation && { currentLocation: dto.currentLocation }),
      ...(dto.incidentNotice !== undefined && {
        incidentNotice: dto.incidentNotice,
      }),
    };

    const updated = await this.repository.updateDriver(id, patch);
    if (!updated) {
      throw new NotFoundException(`Driver ${id} not found.`);
    }
    return updated;
  }

  @Post('reassign-stops')
  async reassignStops(@Body() dto: ReassignStopsDto) {
    const sourceDriver = await this.repository.findDriverById(dto.fromDriverId);
    const targetDriver = await this.repository.findDriverById(dto.toDriverId);

    if (!sourceDriver || !targetDriver) {
      throw new NotFoundException('Source or target driver not found.');
    }

    const orderIdsToMove = sourceDriver.assignedOrderIds;

    // Update target driver
    const updatedTarget: Partial<Driver> = {
      assignedOrderIds: [...targetDriver.assignedOrderIds, ...orderIdsToMove],
      currentPayloadKg:
        targetDriver.currentPayloadKg + sourceDriver.currentPayloadKg,
    };

    // Update source driver
    const updatedSource: Partial<Driver> = {
      assignedOrderIds: [],
      currentPayloadKg: 0,
      incidentNotice: `All ${orderIdsToMove.length} stops reassigned to ${targetDriver.name} due to roadside issue.`,
    };

    await Promise.all([
      this.repository.updateDriver(dto.toDriverId, updatedTarget),
      this.repository.updateDriver(dto.fromDriverId, updatedSource),
    ]);

    // Update orders
    for (const orderId of orderIdsToMove) {
      await this.repository.updateOrder(orderId, {
        assignedDriverId: dto.toDriverId,
      });
    }

    return {
      success: true,
      reassignedCount: orderIdsToMove.length,
      fromDriver: dto.fromDriverId,
      toDriver: dto.toDriverId,
    };
  }

  @Delete(':id')
  async deleteDriver(@Param('id') id: string) {
    const deleted = await this.repository.deleteDriver(id);
    if (!deleted) {
      throw new NotFoundException(`Driver ${id} not found.`);
    }
    return { success: true, deletedId: id };
  }
}
