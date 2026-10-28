export interface QualityClaim {
  id: string;
  orderId: string;
  clientName: string;
  plantId: string;
  type: 'stain_rewash' | 'torn_damaged' | 'missing_count' | 'creased_press';
  itemSku: string;
  itemName: string;
  count: number;
  creditAmountGbp: number;
  status: 'pending' | 'accepted' | 're_washing';
  loggedAt: string;
}

export interface SubcontractorPlant {
  id: string;
  name: string;
  location: string;
  postalCode: string;
  speciality: string;
  dailyCapacityKg: number;
  currentLoadKg: number;
  activeBatchCount: number;
  readyForPickupCount: number;
  defectRatePct: number;
  slaPunctualityPct: number;
  contactPerson: string;
  phone: string;
  email: string;
  claims: QualityClaim[];
}
