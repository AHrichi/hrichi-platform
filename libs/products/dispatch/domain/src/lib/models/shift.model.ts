export type ShiftType = 'shift_a' | 'shift_b';

export interface CoordinatorProfile {
  id: string;
  name: string;
  shift: ShiftType;
  shiftHours: string;
  avatar: string;
  phone: string;
}

export interface ShiftHandoverReport {
  shift: ShiftType;
  shiftHours: string;
  date: string;
  generatedAt: string;
  outgoingCoordinator: string;
  incomingCoordinator: string;
  ordersCompleted: number;
  ordersTarget: number;
  totalKgDelivered: number;
  onTimePunctualityPct: number;
  unresolvedIncidents: {
    id: string;
    title: string;
    status: string;
  }[];
  criticalPendingDrops: {
    orderId: string;
    clientName: string;
    deadline: string;
    status: string;
    driverName: string;
  }[];
  notesForIncoming: string;
}
