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
  | 'kanban'
  | 'whatsapp'
  | 'drivers'
  | 'plants'
  | 'stock'
  | 'analytics'
  | 'customer_portal';

export interface CurrentDispatchUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'coordinator' | 'driver' | 'plant_manager' | 'customer';
  associatedId?: string;
  companyName?: string;
  token?: string;
}

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
  showAuthModal: boolean;
  currentUser: CurrentDispatchUser;
  isCloudConnected: boolean;
  dbQuotaUsage: {
    ordersCount: number;
    maxOrders: number;
    pct: number;
    status: 'safe' | 'warning' | 'near_limit';
  };
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
  showAuthModal: false,
  currentUser: {
    id: 'usr_coord_101',
    email: 'coordinator@lplaundry.co.uk',
    name: 'Sarah Jenkins (Shift Coordinator)',
    role: 'coordinator',
    companyName: 'LP Laundry Operations',
  },
  isCloudConnected: false,
  dbQuotaUsage: {
    ordersCount: 0,
    maxOrders: 50,
    pct: 0,
    status: 'safe',
  },
  londonTime: '12:45',
};
