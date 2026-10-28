import { describe, it, expect } from 'vitest';
import {
  calculateOnTimeRate,
  calculateTotalKg,
  calculateDeliveredKg,
  isOrderAtRisk,
  calculatePlantUtilization,
  formatWeight,
  formatCurrency,
  generateHandoverWhatsAppText,
} from './metrics';
import type { Order } from '../models/order.model';
import type { SubcontractorPlant } from '../models/subcontractor.model';
import type { ShiftHandoverReport } from '../models/shift.model';

describe('Dispatch Domain Metrics', () => {
  const dummyOrders: Order[] = [
    {
      id: 'ORD-1',
      clientName: 'Hotel One',
      clientSector: 'hotel',
      address: 'Mayfair',
      zone: 'W1',
      status: 'delivered',
      totalWeightKg: 100,
      items: [],
      slaDeadline: '14:00',
      targetDeliveryWindow: '13:00 - 14:00',
      assignedDriverId: 'd1',
      assignedPlantId: 'p1',
      specialInstructions: '',
      isEmergency: false,
      pod: null,
      createdAt: '08:00',
      updatedAt: '12:00',
    },
    {
      id: 'ORD-2',
      clientName: 'Hotel Two',
      clientSector: 'hotel',
      address: 'Soho',
      zone: 'W1',
      status: 'delivered',
      totalWeightKg: 150,
      items: [],
      slaDeadline: '15:00',
      targetDeliveryWindow: '14:00 - 15:00',
      assignedDriverId: 'd1',
      assignedPlantId: 'p1',
      specialInstructions: '',
      isEmergency: true,
      pod: null,
      createdAt: '08:00',
      updatedAt: '13:00',
    },
    {
      id: 'ORD-3',
      clientName: 'Hotel Three',
      clientSector: 'hotel',
      address: 'Covent Garden',
      zone: 'WC2',
      status: 'intake',
      totalWeightKg: 80,
      items: [],
      slaDeadline: '13:15',
      targetDeliveryWindow: '12:30 - 13:15',
      assignedDriverId: null,
      assignedPlantId: 'p1',
      specialInstructions: '',
      isEmergency: false,
      pod: null,
      createdAt: '08:00',
      updatedAt: '08:00',
    },
  ];

  it('calculates total and delivered weight correctly', () => {
    expect(calculateTotalKg(dummyOrders)).toBe(330);
    expect(calculateDeliveredKg(dummyOrders)).toBe(250);
  });

  it('calculates on-time delivery rate correctly', () => {
    // 2 delivered, 1 of which is not emergency -> 50%
    expect(calculateOnTimeRate(dummyOrders)).toBe(50);
  });

  it('identifies at-risk orders within 45 minutes of deadline', () => {
    // Current time: 12:45. ORD-3 deadline is 13:15 (30 mins away, intake status) -> at risk!
    expect(isOrderAtRisk(dummyOrders[2], '12:45')).toBe(true);

    // Current time: 10:00 -> not at risk
    expect(isOrderAtRisk(dummyOrders[2], '10:00')).toBe(false);

    // Delivered orders are never at risk
    expect(isOrderAtRisk(dummyOrders[0], '13:55')).toBe(false);
  });

  it('calculates plant capacity utilization percentage', () => {
    const plant: SubcontractorPlant = {
      id: 'p1',
      name: 'Plant A',
      location: 'London',
      postalCode: 'W3',
      speciality: 'Wash',
      dailyCapacityKg: 1000,
      currentLoadKg: 750,
      activeBatchCount: 3,
      readyForPickupCount: 1,
      defectRatePct: 0.5,
      slaPunctualityPct: 98,
      contactPerson: 'Alex',
      phone: '123',
      email: 'a@p.com',
      claims: [],
    };
    expect(calculatePlantUtilization(plant)).toBe(75);
  });

  it('formats weight and currency', () => {
    expect(formatWeight(1500)).toBe('1,500 kg');
    expect(formatCurrency(45.5)).toContain('45.50');
  });

  it('generates WhatsApp formatted handover text', () => {
    const report: ShiftHandoverReport = {
      shift: 'shift_a',
      shiftHours: '07:00 – 13:00',
      date: '28 Oct 2026',
      generatedAt: '12:55',
      outgoingCoordinator: 'Farhan Malik',
      incomingCoordinator: 'Priya Sharma',
      ordersCompleted: 42,
      ordersTarget: 50,
      totalKgDelivered: 850,
      onTimePunctualityPct: 96.5,
      unresolvedIncidents: [
        { id: '1', title: 'Van 3 Breakdown', status: 'In Progress' },
      ],
      criticalPendingDrops: [
        {
          orderId: 'ORD-8404',
          clientName: 'The Dorchester',
          deadline: '14:00',
          status: 'In Transit',
          driverName: 'Tariq',
        },
      ],
      notesForIncoming: 'Check delivery dock at 14:00.',
    };
    const text = generateHandoverWhatsAppText(report);
    expect(text).toContain('PULSE OPS · END OF SHIFT HANDOVER REPORT');
    expect(text).toContain('Farhan Malik');
    expect(text).toContain('Van 3 Breakdown');
    expect(text).toContain('The Dorchester');
  });
});
