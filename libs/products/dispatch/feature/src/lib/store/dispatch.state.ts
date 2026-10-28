import type {
  Order,
  Driver,
  SubcontractorPlant,
  LinenSKU,
  WhatsAppMessage,
  OpsIncident,
  ShiftType,
  WhatsAppChannelType,
} from '@ah/products/dispatch/domain';
import {
  INITIAL_ORDERS,
  INITIAL_DRIVERS,
  INITIAL_SUBCONTRACTORS,
  INITIAL_STOCK,
  INITIAL_MESSAGES,
  INITIAL_INCIDENTS,
} from '@ah/products/dispatch/domain';

export type DispatchTab =
  'kanban' | 'whatsapp' | 'drivers' | 'plants' | 'stock' | 'analytics';

export interface DispatchState {
  orders: Order[];
  drivers: Driver[];
  subcontractors: SubcontractorPlant[];
  stock: LinenSKU[];
  messages: WhatsAppMessage[];
  incidents: OpsIncident[];
  activeShift: ShiftType;
  activeTab: DispatchTab;
  filterSector: string;
  searchQuery: string;
  activeWhatsAppChannel: WhatsAppChannelType;
  isSyncingSheets: boolean;
  lastSheetsSyncedAt: string | null;
  selectedOrderIdForPod: string | null;
  showHandoverModal: boolean;
  showEmergencyModal: boolean;
  emergencyOrderTargetId: string | null;
  londonTime: string;
}

export const initialDispatchState: DispatchState = {
  orders: INITIAL_ORDERS,
  drivers: INITIAL_DRIVERS,
  subcontractors: INITIAL_SUBCONTRACTORS,
  stock: INITIAL_STOCK,
  messages: INITIAL_MESSAGES,
  incidents: INITIAL_INCIDENTS,
  activeShift: 'shift_a',
  activeTab: 'kanban',
  filterSector: 'all',
  searchQuery: '',
  activeWhatsAppChannel: 'customers',
  isSyncingSheets: false,
  lastSheetsSyncedAt: '12:00 (Auto-Sync)',
  selectedOrderIdForPod: null,
  showHandoverModal: false,
  showEmergencyModal: false,
  emergencyOrderTargetId: null,
  londonTime: '12:45',
};
