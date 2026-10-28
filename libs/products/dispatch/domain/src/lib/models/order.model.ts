export type OrderStatus =
  | 'intake'
  | 'collection_transit'
  | 'subcontractor_plant'
  | 'qc_ready'
  | 'delivery_transit'
  | 'delivered';

export type ClientSector =
  'hotel' | 'restaurant' | 'airbnb' | 'spa_gym' | 'corporate';

export interface LinenItemCount {
  sku: string;
  name: string;
  quantity: number;
  weightKg: number;
}

export interface ProofOfDelivery {
  recipientName: string;
  recipientTitle: string;
  signatureSvg: string;
  deliveredAt: string;
  bagsCount: number;
  sealNumbers: string[];
  photoUrl?: string;
  notes?: string;
}

export interface Order {
  id: string;
  clientName: string;
  clientSector: ClientSector;
  address: string;
  zone: string;
  status: OrderStatus;
  totalWeightKg: number;
  items: LinenItemCount[];
  slaDeadline: string; // "14:30"
  targetDeliveryWindow: string; // "13:30 - 15:00"
  assignedDriverId: string | null;
  assignedPlantId: string;
  specialInstructions: string;
  isEmergency: boolean;
  pod: ProofOfDelivery | null;
  subcontractStage?: 'washing' | 'drying' | 'pressing' | 'qc_packing';
  createdAt: string;
  updatedAt: string;
}
