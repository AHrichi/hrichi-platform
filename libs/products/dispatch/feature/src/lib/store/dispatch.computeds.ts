import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import type { DispatchState } from './dispatch.state';
import {
  calculateOnTimeRate,
  calculateTotalKg,
  calculateDeliveredKg,
  isOrderAtRisk,
  INITIAL_COORDINATORS,
  type ShiftHandoverReport,
} from '@ah/products/dispatch/domain';

export function withDispatchComputeds() {
  return signalStoreFeature(
    { state: type<DispatchState>() },
    withComputed((state) => {
      const orders = state.orders;
      const drivers = state.drivers;
      const stock = state.stock;
      const incidents = state.incidents;
      const activeShift = state.activeShift;
      const activeWhatsAppChannel = state.activeWhatsAppChannel;
      const filterSector = state.filterSector;
      const searchQuery = state.searchQuery;
      const londonTime = state.londonTime;

      const totalOrdersCount = computed(() => orders().length);

      const completedOrders = computed(() =>
        orders().filter((o) => o.status === 'delivered'),
      );

      const completedOrdersCount = computed(() => completedOrders().length);

      const pendingOrdersCount = computed(
        () => totalOrdersCount() - completedOrdersCount(),
      );

      const totalWeightProcessedKg = computed(() => calculateTotalKg(orders()));

      const totalWeightDeliveredKg = computed(() =>
        calculateDeliveredKg(orders()),
      );

      const onTimeRatePct = computed(() => calculateOnTimeRate(orders()));

      const activeFleetCount = computed(
        () => drivers().filter((d) => d.status === 'on_route').length,
      );

      const delayedFleetCount = computed(
        () =>
          drivers().filter(
            (d) => d.status === 'delayed' || d.status === 'breakdown',
          ).length,
      );

      const atRiskOrders = computed(() =>
        orders().filter((o) => isOrderAtRisk(o, londonTime())),
      );

      const atRiskOrdersCount = computed(() => atRiskOrders().length);

      const activeIncidents = computed(() =>
        incidents().filter((i) => !i.resolved),
      );

      const activeIncidentsCount = computed(() => activeIncidents().length);

      const urgentIncident = computed(
        () =>
          activeIncidents().find((i) => i.severity === 'critical') ??
          activeIncidents()[0] ??
          null,
      );

      const activeCoordinator = computed(
        () =>
          INITIAL_COORDINATORS.find((c) => c.shift === activeShift()) ??
          INITIAL_COORDINATORS[0],
      );

      const filteredOrders = computed(() => {
        let list = orders();
        const sector = filterSector();
        if (sector && sector !== 'all') {
          list = list.filter((o) => o.clientSector === sector);
        }
        const q = searchQuery().trim().toLowerCase();
        if (q) {
          list = list.filter(
            (o) =>
              o.id.toLowerCase().includes(q) ||
              o.clientName.toLowerCase().includes(q) ||
              o.address.toLowerCase().includes(q) ||
              o.zone.toLowerCase().includes(q) ||
              (o.specialInstructions &&
                o.specialInstructions.toLowerCase().includes(q)),
          );
        }
        return list;
      });

      const channelMessages = computed(() =>
        state.messages().filter((m) => m.channel === activeWhatsAppChannel()),
      );

      const stockTotalValuationGbp = computed(() =>
        Math.round(
          stock().reduce(
            (sum, item) =>
              sum +
              (item.inCirculation + item.atPlantWash + item.inCleanReserve) *
                item.replacementCostGbp,
            0,
          ),
        ),
      );

      const lowStockCount = computed(
        () =>
          stock().filter((item) => item.inCleanReserve < item.minThreshold)
            .length,
      );

      const handoverReport = computed<ShiftHandoverReport>(() => {
        const shift = activeShift();
        const incoming = INITIAL_COORDINATORS.find((c) => c.shift !== shift)!;
        const currentCoord = activeCoordinator();

        const pendingCritical = orders()
          .filter((o) => o.status !== 'delivered')
          .map((o) => {
            const driver = drivers().find((d) => d.id === o.assignedDriverId);
            return {
              orderId: o.id,
              clientName: o.clientName,
              deadline: o.slaDeadline,
              status: o.status.replace(/_/g, ' ').toUpperCase(),
              driverName: driver ? driver.name : 'Unassigned',
            };
          });

        return {
          shift,
          shiftHours: currentCoord.shiftHours,
          date: '28 Oct 2026',
          generatedAt: londonTime(),
          outgoingCoordinator: currentCoord.name,
          incomingCoordinator: incoming.name,
          ordersCompleted: completedOrdersCount(),
          ordersTarget: totalOrdersCount(),
          totalKgDelivered: totalWeightDeliveredKg(),
          onTimePunctualityPct: onTimeRatePct(),
          unresolvedIncidents: activeIncidents().map((i) => ({
            id: i.id,
            title: i.title,
            status: i.severity.toUpperCase(),
          })),
          criticalPendingDrops: pendingCritical,
          notesForIncoming:
            shift === 'shift_a'
              ? 'Shift A summary: Van 3 breakdown roadside cross-load handled. Please monitor The Ned (ORD-8405) ready for pickup at Park Royal Plant.'
              : 'Shift B summary: All evening drops reconciled. Night batch manifests sent to Thames Valley and Apex plants.',
        };
      });

      return {
        totalOrdersCount,
        completedOrdersCount,
        pendingOrdersCount,
        totalWeightProcessedKg,
        totalWeightDeliveredKg,
        onTimeRatePct,
        activeFleetCount,
        delayedFleetCount,
        atRiskOrders,
        atRiskOrdersCount,
        activeIncidents,
        activeIncidentsCount,
        urgentIncident,
        activeCoordinator,
        filteredOrders,
        channelMessages,
        stockTotalValuationGbp,
        lowStockCount,
        handoverReport,
      };
    }),
  );
}
