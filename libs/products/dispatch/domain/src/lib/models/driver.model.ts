export type DriverStatus =
  'on_route' | 'idle' | 'delayed' | 'breakdown' | 'emergency_courier';

export interface DriverStop {
  orderId: string;
  clientName: string;
  address: string;
  type: 'pickup' | 'dropoff';
  targetTime: string;
  completed: boolean;
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  registration: string;
  zone: string;
  status: DriverStatus;
  activeShift: 'shift_a' | 'shift_b';
  currentLocation: string;
  assignedOrderIds: string[];
  completedOrderIds: string[];
  stops: DriverStop[];
  etaNextStop: string | null;
  incidentNotice: string | null;
  capacityKg: number;
  currentPayloadKg: number;
}
