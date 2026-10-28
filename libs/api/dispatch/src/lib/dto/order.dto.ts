import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  ClientSector,
  OrderStatus,
  LinenItemCount,
  ProofOfDelivery,
} from '@ah/products/dispatch/domain';

export class OrderItemDto implements LinenItemCount {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0.1)
  weightKg!: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  clientName!: string;

  @IsString()
  @IsIn(['hotel', 'restaurant', 'airbnb', 'spa_gym', 'corporate'])
  clientSector!: ClientSector;

  @IsString()
  address!: string;

  @IsString()
  zone!: string;

  @IsNumber()
  @Min(1)
  totalWeightKg!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString()
  slaDeadline!: string;

  @IsString()
  targetDeliveryWindow!: string;

  @IsOptional()
  @IsString()
  assignedDriverId?: string | null;

  @IsOptional()
  @IsString()
  assignedPlantId?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn([
    'intake',
    'collection_transit',
    'subcontractor_plant',
    'qc_ready',
    'delivery_transit',
    'delivered',
  ])
  status!: OrderStatus;

  @IsOptional()
  pod?: ProofOfDelivery | null;
}

export class AssignDriverDto {
  @IsString()
  driverId!: string;
}
