import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @IsString()
  location!: string;

  @IsString()
  postalCode!: string;

  @IsString()
  speciality!: string;

  @IsNumber()
  @Min(100)
  dailyCapacityKg!: number;

  @IsString()
  contactPerson!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateQualityClaimDto {
  @IsString()
  plantId!: string;

  @IsString()
  clientName!: string;

  @IsString()
  itemSku!: string;

  @IsNumber()
  @Min(1)
  count!: number;

  @IsString()
  @IsIn(['stain_rewash', 'torn_damaged', 'missing_count', 'creased_press'])
  type!: 'stain_rewash' | 'torn_damaged' | 'missing_count' | 'creased_press';

  @IsOptional()
  @IsString()
  orderId?: string;
}
