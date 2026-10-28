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
  showAddOrderModal: boolean;
  showAddDriverModal: boolean;
  showAddPlantModal: boolean;
  showAddStockModal: boolean;
  londonTime: string;
}

export const initialDispatchState: DispatchState = {
  orders: [],
  drivers: [],
  subcontractors: [],
  stock: [],
  messages: [],
  incidents: [],
  activeShift: 'shift_a',
  activeTab: 'kanban',
  filterSector: 'all',
  searchQuery: '',
  activeWhatsAppChannel: 'customers',
  isSyncingSheets: false,
  lastSheetsSyncedAt: null,
  selectedOrderIdForPod: null,
  showHandoverModal: false,
  showEmergencyModal: false,
  emergencyOrderTargetId: null,
  showAddOrderModal: false,
  showAddDriverModal: false,
  showAddPlantModal: false,
  showAddStockModal: false,
  londonTime: '12:45',
};
