export type LinenCategory =
  'bedding' | 'bath' | 'dining' | 'uniform' | 'kitchen';

export interface LinenSKU {
  sku: string;
  name: string;
  category: LinenCategory;
  unitWeightGrams: number;
  inCirculation: number;
  atPlantWash: number;
  inCleanReserve: number;
  damagedScrap: number;
  disputedMissing: number;
  minThreshold: number;
  replacementCostGbp: number;
  lastUpdated: string;
}
