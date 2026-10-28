import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AssignDriverDto,
} from '../dto/order.dto';
import { MongoDispatchRepository } from '../repositories/mongo-dispatch.repository';
import type { AuthenticatedRequest } from '../guards/dispatch-auth.guard';
import type { Order } from '@ah/products/dispatch/domain';

@Controller('api/dispatch/orders')
export class DispatchOrdersController {
  constructor(private readonly repository: MongoDispatchRepository) {}

  @Get()
  async listOrders(@Req() req: AuthenticatedRequest) {
    // If authenticated via Bearer, pass session for role filtering; otherwise return all orders
    return this.repository.listOrders(req.user);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    const order = await this.repository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return order;
  }

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    const newId = dto.id || `ORD-${Math.floor(8420 + Math.random() * 80)}`;
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newOrder: Order = {
      id: newId,
      clientName: dto.clientName.trim(),
      clientSector: dto.clientSector,
      address: dto.address.trim(),
      zone: dto.zone.trim(),
      status: 'intake',
      totalWeightKg: dto.totalWeightKg,
      items: dto.items,
      slaDeadline: dto.slaDeadline.trim(),
      targetDeliveryWindow: dto.targetDeliveryWindow.trim(),
      assignedDriverId: dto.assignedDriverId || null,
      assignedPlantId: dto.assignedPlantId || 'plant-general',
      specialInstructions: dto.specialInstructions || '',
      isEmergency: dto.isEmergency || false,
      pod: null,
      createdAt: nowHhMm,
      updatedAt: nowHhMm,
    };

    return this.repository.createOrder(newOrder);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const patch: Partial<Order> = {
      status: dto.status,
      updatedAt: nowHhMm,
      ...(dto.pod !== undefined && { pod: dto.pod }),
    };

    const updated = await this.repository.updateOrder(id, patch);
    if (!updated) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return updated;
  }

  @Patch(':id/driver')
  async assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    const updated = await this.repository.updateOrder(id, {
      assignedDriverId: dto.driverId,
    });
    if (!updated) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return updated;
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    const deleted = await this.repository.deleteOrder(id);
    if (!deleted) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return { success: true, deletedId: id };
  }
}
