import type { Order } from '../models/order.model';
import type { SubcontractorPlant } from '../models/subcontractor.model';
import type { ShiftHandoverReport } from '../models/shift.model';

export function calculateOnTimeRate(orders: Order[]): number {
  if (orders.length === 0) return 100;
  const completed = orders.filter((o) => o.status === 'delivered');
  if (completed.length === 0) return 100;
  // Consider orders without late incidents as on-time
  const onTime = completed.filter((o) => !o.isEmergency);
  return Math.round((onTime.length / completed.length) * 1000) / 10;
}

export function calculateTotalKg(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + (o.totalWeightKg || 0), 0);
}

export function calculateDeliveredKg(orders: Order[]): number {
  return orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalWeightKg || 0), 0);
}

export function isOrderAtRisk(order: Order, nowHhMm = '12:45'): boolean {
  if (order.status === 'delivered') return false;

  const [deadlineH, deadlineM] = order.slaDeadline.split(':').map(Number);
  const [currentH, currentM] = nowHhMm.split(':').map(Number);

  const deadlineMinutes = (deadlineH || 0) * 60 + (deadlineM || 0);
  const currentMinutes = (currentH || 0) * 60 + (currentM || 0);

  const diff = deadlineMinutes - currentMinutes;
  // At risk if due within 45 minutes and not yet in delivery transit or delivered
  return diff <= 45 && order.status !== 'delivery_transit';
}

export function calculatePlantUtilization(plant: SubcontractorPlant): number {
  if (!plant.dailyCapacityKg) return 0;
  return Math.min(
    100,
    Math.round((plant.currentLoadKg / plant.dailyCapacityKg) * 100),
  );
}

export function generateHandoverWhatsAppText(
  report: ShiftHandoverReport,
): string {
  const incidentList =
    report.unresolvedIncidents.length > 0
      ? report.unresolvedIncidents
          .map((i) => `  ⚠️ ${i.title} [${i.status}]`)
          .join('\n')
      : '  ✅ All incidents resolved cleanly.';

  const pendingList =
    report.criticalPendingDrops.length > 0
      ? report.criticalPendingDrops
          .map(
            (d) =>
              `  • ${d.clientName} (SLA ${d.deadline}) - ${d.status} [${d.driverName}]`,
          )
          .join('\n')
      : '  ✅ Zero pending drops.';

  return `*📋 PULSE OPS · END OF SHIFT HANDOVER REPORT*
*Shift:* ${report.shift.toUpperCase()} (${report.shiftHours})
*Date:* ${report.date}
*Outgoing Coordinator:* ${report.outgoingCoordinator}
*Incoming Coordinator:* ${report.incomingCoordinator}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*📊 PERFORMANCE SUMMARY*
• Completed Drops: ${report.ordersCompleted} / ${report.ordersTarget}
• Total Linen Delivered: ${report.totalKgDelivered} kg
• SLA On-Time Rate: ${report.onTimePunctualityPct}%

*⚠️ OPEN ISSUES / INCIDENTS:*
${incidentList}

*⏳ PENDING CRITICAL DROPS FOR INCOMING SHIFT:*
${pendingList}

*📝 HANDOVER NOTES:*
"${report.notesForIncoming}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Report auto-compiled by PulseOps Control Center_`;
}

export function formatWeight(kg: number): string {
  return `${kg.toLocaleString('en-GB')} kg`;
}

export function formatCurrency(gbp: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(gbp);
}
