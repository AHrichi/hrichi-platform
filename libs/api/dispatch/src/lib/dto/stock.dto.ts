import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { LinenCategory } from '@ah/products/dispatch/domain';

export class CreateStockDto {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsIn(['bedding', 'bath', 'dining', 'uniform', 'kitchen'])
  category!: LinenCategory;

  @IsNumber()
  @Min(10)
  unitWeightGrams!: number;

  @IsNumber()
  @Min(0)
  inCleanReserve!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inCirculation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  atPlantWash?: number;

  @IsNumber()
  @Min(1)
  minThreshold!: number;

  @IsNumber()
  @Min(0.5)
  replacementCostGbp!: number;
}

export class UpdateStockQuantityDto {
  @IsString()
  @IsIn([
    'inCleanReserve',
    'inCirculation',
    'atPlantWash',
    'damagedScrap',
    'disputedMissing',
  ])
  field!:
    | 'inCleanReserve'
    | 'inCirculation'
    | 'atPlantWash'
    | 'damagedScrap'
    | 'disputedMissing';

  @IsNumber()
  delta!: number;
}
