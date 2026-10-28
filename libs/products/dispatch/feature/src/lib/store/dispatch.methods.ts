import {
  patchState,
  signalStoreFeature,
  type,
  withMethods,
} from '@ngrx/signals';
import type { DispatchState, DispatchTab } from './dispatch.state';
import { initialDispatchState } from './dispatch.state';
import type {
  OrderStatus,
  Order,
  Driver,
  SubcontractorPlant,
  LinenSKU,
  ProofOfDelivery,
  WhatsAppChannelType,
  ClientSector,
  QualityClaim,
} from '@ah/products/dispatch/domain';
import {
  INITIAL_ORDERS,
  INITIAL_DRIVERS,
  INITIAL_SUBCONTRACTORS,
  INITIAL_STOCK,
  INITIAL_MESSAGES,
  INITIAL_INCIDENTS,
} from '@ah/products/dispatch/domain';

const STATUS_PIPELINE: OrderStatus[] = [
  'intake',
  'collection_transit',
  'subcontractor_plant',
  'qc_ready',
  'delivery_transit',
  'delivered',
];

export function withDispatchMethods() {
  return signalStoreFeature(
    { state: type<DispatchState>() },
    withMethods((state) => ({
      setTab(activeTab: DispatchTab) {
        patchState(state, { activeTab });
      },

      setFilterSector(filterSector: string) {
        patchState(state, { filterSector });
      },

      setSearchQuery(searchQuery: string) {
        patchState(state, { searchQuery });
      },

      setWhatsAppChannel(activeWhatsAppChannel: WhatsAppChannelType) {
        patchState(state, { activeWhatsAppChannel });
      },

      toggleShift() {
        const nextShift =
          state.activeShift() === 'shift_a' ? 'shift_b' : 'shift_a';
        patchState(state, { activeShift: nextShift });
      },

      advanceOrderStatus(orderId: string) {
        const currentOrders = state.orders();
        const updated = currentOrders.map((o) => {
          if (o.id !== orderId) return o;
          const currentIndex = STATUS_PIPELINE.indexOf(o.status);
          if (currentIndex < STATUS_PIPELINE.length - 1) {
            const nextStatus = STATUS_PIPELINE[currentIndex + 1];
            return {
              ...o,
              status: nextStatus,
              updatedAt: new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          }
          return o;
        });
        patchState(state, { orders: updated });
      },

      regressOrderStatus(orderId: string) {
        const currentOrders = state.orders();
        const updated = currentOrders.map((o) => {
          if (o.id !== orderId) return o;
          const currentIndex = STATUS_PIPELINE.indexOf(o.status);
          if (currentIndex > 0) {
            const prevStatus = STATUS_PIPELINE[currentIndex - 1];
            return {
              ...o,
              status: prevStatus,
              updatedAt: new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          }
          return o;
        });
        patchState(state, { orders: updated });
      },

      reassignDriver(orderId: string, driverId: string) {
        const updatedOrders = state
          .orders()
          .map((o) =>
            o.id === orderId ? { ...o, assignedDriverId: driverId } : o,
          );
        const updatedDrivers = state.drivers().map((d) => {
          const hasOrder = d.assignedOrderIds.includes(orderId);
          if (d.id === driverId && !hasOrder) {
            return { ...d, assignedOrderIds: [...d.assignedOrderIds, orderId] };
          }
          if (d.id !== driverId && hasOrder) {
            return {
              ...d,
              assignedOrderIds: d.assignedOrderIds.filter(
                (id) => id !== orderId,
              ),
            };
          }
          return d;
        });
        patchState(state, { orders: updatedOrders, drivers: updatedDrivers });
      },

      createOrderFromMessage(
        clientName: string,
        clientSector: ClientSector,
        address: string,
        slaDeadline: string,
      ) {
        const newId = `ORD-${Math.floor(8410 + Math.random() * 90)}`;
        const nowHhMm = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const newOrder: Order = {
          id: newId,
          clientName,
          clientSector,
          address,
          zone: 'Central London',
          status: 'intake',
          totalWeightKg: 75,
          items: [
            {
              sku: 'BTH-TWL-SHT',
              name: 'Bath Sheet 650gsm White',
              quantity: 60,
              weightKg: 36,
            },
            {
              sku: 'BTH-TWL-HND',
              name: 'Hand Towel 500gsm White',
              quantity: 70,
              weightKg: 14,
            },
            {
              sku: 'BTH-MAT-PRM',
              name: 'Bath Mat Ribbed Greek Key',
              quantity: 25,
              weightKg: 8,
            },
          ],
          slaDeadline,
          targetDeliveryWindow: `${slaDeadline} Express`,
          assignedDriverId: 'drv-carlos',
          assignedPlantId: 'plant-thames',
          specialInstructions: 'Created directly via WhatsApp intake.',
          isEmergency: false,
          pod: null,
          createdAt: nowHhMm,
          updatedAt: nowHhMm,
        };

        const confirmMsg = {
          id: `msg-${Date.now()}`,
          channel: 'customers' as WhatsAppChannelType,
          senderName: 'PulseOps Coordinator',
          senderRole: 'Coordinator · Operations',
          timestamp: nowHhMm,
          text: `Order ${newId} confirmed! Assigned to Driver Carlos for pickup. Target delivery window: ${slaDeadline}.`,
          isCoordinator: true,
          orderIdRef: newId,
        };

        patchState(state, {
          orders: [newOrder, ...state.orders()],
          messages: [...state.messages(), confirmMsg],
          activeTab: 'kanban',
        });
      },

      sendWhatsAppMessage(
        channel: WhatsAppChannelType,
        text: string,
        isCoordinator = true,
        senderName = 'Farhan Malik (Coordinator)',
      ) {
        const nowHhMm = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const newMsg = {
          id: `msg-${Date.now()}`,
          channel,
          senderName,
          senderRole: isCoordinator ? 'PulseOps Coordinator' : 'Staff',
          timestamp: nowHhMm,
          text,
          isCoordinator,
        };
        patchState(state, { messages: [...state.messages(), newMsg] });
      },

      resolveIncident(incidentId: string) {
        const updated = state
          .incidents()
          .map((i) => (i.id === incidentId ? { ...i, resolved: true } : i));
        patchState(state, { incidents: updated });
      },

      openEmergencyModal(orderId: string) {
        patchState(state, {
          showEmergencyModal: true,
          emergencyOrderTargetId: orderId,
        });
      },

      closeEmergencyModal() {
        patchState(state, {
          showEmergencyModal: false,
          emergencyOrderTargetId: null,
        });
      },

      dispatchEmergencyCourier(orderId: string, courierName: string) {
        const nowHhMm = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const updatedOrders = state.orders().map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            isEmergency: true,
            status: 'delivery_transit' as OrderStatus,
            specialInstructions: `🚨 Dispatched via Emergency Courier: ${courierName}. ETA 25 mins.`,
            updatedAt: nowHhMm,
          };
        });

        const newMsg = {
          id: `msg-${Date.now()}`,
          channel: 'drivers' as WhatsAppChannelType,
          senderName: 'PulseOps Coordinator',
          senderRole: 'Operations Dispatch',
          timestamp: nowHhMm,
          text: `⚡ Emergency dispatch booked with ${courierName} for ${orderId}. Courier is en-route directly to delivery address.`,
          isCoordinator: true,
          orderIdRef: orderId,
        };

        patchState(state, {
          orders: updatedOrders,
          messages: [...state.messages(), newMsg],
          showEmergencyModal: false,
          emergencyOrderTargetId: null,
        });
      },

      reassignStops(fromDriverId: string, toDriverId: string) {
        const fromDriver = state.drivers().find((d) => d.id === fromDriverId);
        const toDriver = state.drivers().find((d) => d.id === toDriverId);
        if (!fromDriver || !toDriver) return;

        const transferredOrderIds = [...fromDriver.assignedOrderIds];

        const updatedOrders = state.orders().map((o) => {
          if (transferredOrderIds.includes(o.id)) {
            return {
              ...o,
              assignedDriverId: toDriverId,
              specialInstructions: `Reassigned from ${fromDriver.name} to ${toDriver.name} due to vehicle breakdown.`,
            };
          }
          return o;
        });

        const updatedDrivers = state.drivers().map((d) => {
          if (d.id === fromDriverId) {
            return {
              ...d,
              assignedOrderIds: [],
              status: 'breakdown' as const,
              incidentNotice:
                'All pending stops transferred to standby driver.',
            };
          }
          if (d.id === toDriverId) {
            return {
              ...d,
              status: 'on_route' as const,
              assignedOrderIds: [...d.assignedOrderIds, ...transferredOrderIds],
              incidentNotice: `Active rapid rescue for ${fromDriver.name}.`,
            };
          }
          return d;
        });

        const nowHhMm = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const notifyMsg = {
          id: `msg-${Date.now()}`,
          channel: 'drivers' as WhatsAppChannelType,
          senderName: 'PulseOps Coordinator',
          senderRole: 'Operations Dispatch',
          timestamp: nowHhMm,
          text: `🚨 Reroute confirmed: ${transferredOrderIds.length} stops from ${fromDriver.name} successfully transferred to ${toDriver.name} (Standby Van LD24).`,
          isCoordinator: true,
        };

        patchState(state, {
          orders: updatedOrders,
          drivers: updatedDrivers,
          messages: [...state.messages(), notifyMsg],
        });
      },

      openPodModal(orderId: string) {
        patchState(state, { selectedOrderIdForPod: orderId });
      },

      closePodModal() {
        patchState(state, { selectedOrderIdForPod: null });
      },

      submitPod(orderId: string, pod: ProofOfDelivery) {
        const nowHhMm = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const updatedOrders = state.orders().map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'delivered' as OrderStatus,
                pod,
                updatedAt: nowHhMm,
              }
            : o,
        );
        patchState(state, {
          orders: updatedOrders,
          selectedOrderIdForPod: null,
        });
      },

      logQualityClaim(
        plantId: string,
        clientName: string,
        itemSku: string,
        count: number,
        type: QualityClaim['type'],
      ) {
        const newClaim: QualityClaim = {
          id: `clm-${Date.now()}`,
          orderId: 'ORD-8402',
          clientName,
          plantId,
          type,
          itemSku,
          itemName: 'Soiled/Damaged Linen Item',
          count,
          creditAmountGbp: count * 3.5,
          status: 'pending',
          loggedAt: new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        const updatedSubcontractors = state
          .subcontractors()
          .map((p) =>
            p.id === plantId ? { ...p, claims: [newClaim, ...p.claims] } : p,
          );

        patchState(state, { subcontractors: updatedSubcontractors });
      },

      updateStockItem(
        sku: string,
        field: 'inCleanReserve' | 'atPlantWash' | 'damagedScrap',
        delta: number,
      ) {
        const updatedStock = state.stock().map((item) => {
          if (item.sku !== sku) return item;
          const currentVal = item[field];
          const newVal = Math.max(0, currentVal + delta);
          return {
            ...item,
            [field]: newVal,
            lastUpdated: new Date().toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        });
        patchState(state, { stock: updatedStock });
      },

      async syncGoogleSheets() {
        patchState(state, { isSyncingSheets: true });
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const nowHhMm = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        patchState(state, {
          isSyncingSheets: false,
          lastSheetsSyncedAt: `${nowHhMm} (Synced)`,
        });
      },

      openHandoverModal() {
        patchState(state, { showHandoverModal: true });
      },

      closeHandoverModal() {
        patchState(state, { showHandoverModal: false });
      },

      openAddOrderModal() {
        patchState(state, { showAddOrderModal: true });
      },

      closeAddOrderModal() {
        patchState(state, { showAddOrderModal: false });
      },

      addOrder(newOrder: Order) {
        patchState(state, {
          orders: [newOrder, ...state.orders()],
          showAddOrderModal: false,
        });
      },

      deleteOrder(orderId: string) {
        patchState(state, {
          orders: state.orders().filter((o) => o.id !== orderId),
        });
      },

      openAddDriverModal() {
        patchState(state, { showAddDriverModal: true });
      },

      closeAddDriverModal() {
        patchState(state, { showAddDriverModal: false });
      },

      addDriver(newDriver: Driver) {
        patchState(state, {
          drivers: [...state.drivers(), newDriver],
          showAddDriverModal: false,
        });
      },

      deleteDriver(driverId: string) {
        patchState(state, {
          drivers: state.drivers().filter((d) => d.id !== driverId),
        });
      },

      openAddPlantModal() {
        patchState(state, { showAddPlantModal: true });
      },

      closeAddPlantModal() {
        patchState(state, { showAddPlantModal: false });
      },

      addSubcontractor(newPlant: SubcontractorPlant) {
        patchState(state, {
          subcontractors: [...state.subcontractors(), newPlant],
          showAddPlantModal: false,
        });
      },

      deleteSubcontractor(plantId: string) {
        patchState(state, {
          subcontractors: state
            .subcontractors()
            .filter((p) => p.id !== plantId),
        });
      },

      openAddStockModal() {
        patchState(state, { showAddStockModal: true });
      },

      closeAddStockModal() {
        patchState(state, { showAddStockModal: false });
      },

      addStockItem(newItem: LinenSKU) {
        patchState(state, {
          stock: [...state.stock(), newItem],
          showAddStockModal: false,
        });
      },

      deleteStockItem(sku: string) {
        patchState(state, {
          stock: state.stock().filter((item) => item.sku !== sku),
        });
      },

      clearAllData() {
        patchState(state, {
          orders: [],
          drivers: [],
          subcontractors: [],
          stock: [],
          messages: [],
          incidents: [],
        });
        try {
          localStorage.removeItem('ah_pulseops_state_scratch_v2');
          localStorage.removeItem('ah_pulseops_state_v1');
        } catch {
          // ignore
        }
      },

      loadSampleData() {
        patchState(state, {
          orders: INITIAL_ORDERS,
          drivers: INITIAL_DRIVERS,
          subcontractors: INITIAL_SUBCONTRACTORS,
          stock: INITIAL_STOCK,
          messages: INITIAL_MESSAGES,
          incidents: INITIAL_INCIDENTS,
        });
      },

      resetToDefaults() {
        patchState(state, initialDispatchState);
        try {
          localStorage.removeItem('ah_pulseops_state_scratch_v2');
          localStorage.removeItem('ah_pulseops_state_v1');
        } catch {
          // ignore
        }
      },
    })),
  );
}
