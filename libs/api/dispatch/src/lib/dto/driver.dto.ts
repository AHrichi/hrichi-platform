import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { DriverStatus } from '@ah/products/dispatch/domain';

export class CreateDriverDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  vehicle!: string;

  @IsString()
  registration!: string;

  @IsString()
  zone!: string;

  @IsString()
  @IsIn(['shift_a', 'shift_b'])
  activeShift!: 'shift_a' | 'shift_b';

  @IsString()
  currentLocation!: string;

  @IsNumber()
  @Min(100)
  capacityKg!: number;

  @IsOptional()
  @IsString()
  @IsIn(['on_route', 'idle', 'delayed', 'breakdown', 'emergency_courier'])
  status?: DriverStatus;
}

export class UpdateDriverStatusDto {
  @IsString()
  @IsIn(['on_route', 'idle', 'delayed', 'breakdown', 'emergency_courier'])
  status!: DriverStatus;

  @IsOptional()
  @IsString()
  currentLocation?: string;

  @IsOptional()
  @IsString()
  incidentNotice?: string | null;
}

export class ReassignStopsDto {
  @IsString()
  fromDriverId!: string;

  @IsString()
  toDriverId!: string;
}
