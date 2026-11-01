import { describe, it, expect } from 'vitest';
import { calculatePoleSpacing } from './calculations/spacing';
import { calculateFoundation } from './calculations/foundation';
import { calculateSolarSizing } from './calculations/solar';
import {
  validateConcreteMix,
  calculateConcreteCuringStrengthPct,
} from './calculations/concrete';
import { checkPoleVerticality } from './calculations/verticality';
import { calculateElectricalNetwork } from './calculations/electrical';
import {
  calculateDistanceToTargetBase,
  calculatePoleHeightFromAngle,
  calculateHaversineDistanceMeters,
  measurePoleHeight,
} from './utils/trigonometry';
import {
  generateIcsCalendarEvent,
  formatMilestoneMailtoUrl,
  ReminderCopy,
} from './utils/calendar-export';
import { ProjectItem, MilestoneItem } from './models/lighting.models';

describe('LuxPath Lighting Domain Engine', () => {
  describe('Spacing & Photometrics (EN 13201)', () => {
    it('should validate acceptable pole spacing for M3 class', () => {
      const result = calculatePoleSpacing({
        mountingHeightMeters: 8,
        roadWidthMeters: 7,
        spacingMeters: 28, // S/H = 3.5 <= 4.0
        roadClass: 'M3',
        luminaireLumens: 10000,
        maintenanceFactor: 0.8,
      });

      expect(result.spacingRatio).toBe(3.5);
      expect(result.ratioEvaluation).toBe('optimal');
      expect(result.requiredAverageLux).toBe(15);
      expect(result.estimatedAverageLux).toBeGreaterThan(0);
      expect(result.estimatedUniformity).toBeGreaterThanOrEqual(0.35);
      expect(result.isCompliant).toBe(true);
    });

    it('should flag excessive spacing exceeding ratio limits', () => {
      const result = calculatePoleSpacing({
        mountingHeightMeters: 6,
        roadWidthMeters: 8,
        spacingMeters: 45, // S/H = 7.5 > 4.5
        roadClass: 'M2',
        luminaireLumens: 4000,
        maintenanceFactor: 0.8,
      });

      expect(result.spacingRatio).toBe(7.5);
      expect(result.ratioEvaluation).toBe('excessive');
      expect(result.isCompliant).toBe(false);
      expect(result.notes.map((n) => n.code)).toContain('spacing.excessive');
    });
  });

  describe('Foundation Massif & Excavation Depth (Eurocode 7)', () => {
    it('should compute foundation dimensions with solar panel wind moment', () => {
      const result = calculateFoundation({
        poleHeightMeters: 8,
        windZone: 3,
        soilType: 'compact_gravel',
        hasSolarPanel: true,
        solarPanelAreaM2: 1.2,
        poleMaterial: 'galvanized_steel',
        excavationDepthMeters: 1.8,
      });

      expect(result.minRecommendedDepthMeters).toBeGreaterThanOrEqual(1.2);
      expect(result.recommendedBlockWidthMeters).toBeGreaterThan(0.6);
      expect(result.recommendedBlockLengthMeters).toBeGreaterThan(0.6);
      expect(result.recommendedVolumeM3).toBeGreaterThan(0.4);
      expect(result.minConcreteMassKg).toBeGreaterThan(900);
      expect(result.overturningMomentDanM).toBeGreaterThan(0);
      expect(result.safetyFactor).toBeGreaterThanOrEqual(1.5);
      expect(result.isDepthValid).toBe(true);
    });

    it('should enforce deeper excavation for solar poles compared to standard grid poles', () => {
      const grid = calculateFoundation({
        poleHeightMeters: 7,
        windZone: 2,
        soilType: 'firm_clay',
        hasSolarPanel: false,
        poleMaterial: 'galvanized_steel',
      });

      const solar = calculateFoundation({
        poleHeightMeters: 7,
        windZone: 2,
        soilType: 'firm_clay',
        hasSolarPanel: true,
        solarPanelAreaM2: 1.0,
        poleMaterial: 'galvanized_steel',
      });

      expect(solar.minRecommendedDepthMeters).toBeGreaterThanOrEqual(
        grid.minRecommendedDepthMeters,
      );
      expect(solar.recommendedVolumeM3).toBeGreaterThan(
        grid.recommendedVolumeM3,
      );
    });
  });

  describe('Solar Autonomy & Battery Sizing (IEC 61215 / IEC 62133)', () => {
    it('should calculate solar PV and LiFePO4 battery capacity with dimming profile', () => {
      const result = calculateSolarSizing({
        ledWattage: 40,
        dailyOperatingHours: 11,
        peakSunHours: 4.5,
        autonomyDays: 3,
        systemVoltage: 24,
        batteryChemistry: 'LiFePO4',
        dimmingProfile: {
          hoursStage1: 4,
          pctStage1: 100,
          hoursStage2: 4,
          pctStage2: 50,
          hoursStage3: 3,
          pctStage3: 30,
        },
      });

      expect(result.dailyEnergyConsumptionWh).toBeLessThan(40 * 11); // Due to dimming savings
      expect(result.minSolarPanelPeakWatts).toBeGreaterThan(50);
      expect(result.minBatteryCapacityAh).toBeGreaterThan(0);
      expect(result.mpptControllerAmpRating).toBeGreaterThanOrEqual(10);
      expect(result.co2SavedKgPerYear).toBeGreaterThan(40);
      expect(result.winterSolsticeCoveragePct).toBeGreaterThan(50);
    });
  });

  describe('Concrete Mix & Slump Verification (NF EN 206 / Eurocode 2)', () => {
    it('should validate compliant C25/30 mix recipe with slump 7cm and 350kg cement', () => {
      const result = validateConcreteMix({
        volumeM3: 1.0,
        targetClass: 'C25_30',
        exposure: 'XC2',
        slumpTestCm: 7, // S2: 5 - 9cm
        measuredCementKg: 350,
        measuredWaterLiters: 168,
        mixingMethod: 'ready_mix_truck',
        curingAgeDays: 7,
      });

      expect(result.isCementDosageValid).toBe(true);
      expect(result.isWaterRatioValid).toBe(true);
      expect(result.slumpClassification).toBe('S2');
      expect(result.isSlumpAcceptable).toBe(true);
      expect(result.currentStrengthPctOf28Days).toBeGreaterThanOrEqual(70);
      expect(result.isErectionPermitted).toBe(true); // >= 70% threshold reached at 7 days
      expect(result.overallCompliance).toBe('compliant');
      expect(result.batchRecipes.perCubicMeter.cementKg).toBe(350);
      expect(result.batchRecipes.perCubicMeter.waterLiters).toBe(168);
    });

    it('should flag excessive water-cement ratio and non-compliant curing age (< 7 days)', () => {
      const result = validateConcreteMix({
        volumeM3: 0.8,
        targetClass: 'C25_30',
        exposure: 'XC2',
        slumpTestCm: 22, // S5: excessive fluid
        measuredCementKg: 280, // under 350
        measuredWaterLiters: 200, // W/C > 0.60
        mixingMethod: 'site_batch_mixer',
        curingAgeDays: 3,
      });

      expect(result.isCementDosageValid).toBe(false);
      expect(result.isWaterRatioValid).toBe(false);
      expect(result.isErectionPermitted).toBe(false);
      expect(result.isFullCommissioningPermitted).toBe(false);
      expect(result.overallCompliance).toBe('non_compliant');
    });

    it('should calculate accurate curing strength evolution', () => {
      const strengthDay1 = calculateConcreteCuringStrengthPct(1);
      const strengthDay7 = calculateConcreteCuringStrengthPct(7);
      const strengthDay28 = calculateConcreteCuringStrengthPct(28);

      expect(strengthDay1).toBeLessThan(strengthDay7);
      expect(strengthDay7).toBeGreaterThanOrEqual(68);
      expect(strengthDay28).toBeCloseTo(100, 0);
    });
  });

  describe('Pole Verticality & Plumb Tolerance (EN 40)', () => {
    it('should approve pole within EN 40 1-degree tolerance', () => {
      const plumb = checkPoleVerticality({
        measuredTiltDegrees: 0.2,
        poleHeightMeters: 8,
        baseplateDiameterMm: 300,
      });
      expect(plumb.correction).toBeNull();

      const result = checkPoleVerticality({
        measuredTiltDegrees: 0.5,
        measuredDirection: 'NE',
        poleHeightMeters: 9,
        baseplateDiameterMm: 300,
        anchorBoltPitchMm: 300,
      });

      expect(result.tiltDegrees).toBe(0.5);
      expect(result.maxAllowableTiltDegrees).toBe(1.0);
      expect(result.isCompliant).toBe(true);
      expect(result.status).toBe('acceptable');
      expect(result.displacementAtTipMm).toBeLessThan(160); // 9000 * tan(1 deg) approx 157mm
    });

    it('should reject pole exceeding 1 degree and compute nut adjustment', () => {
      const result = checkPoleVerticality({
        measuredTiltDegrees: 2.1,
        poleHeightMeters: 8,
        baseplateDiameterMm: 250,
        measuredDirection: 'NE',
        anchorBoltPitchMm: 300,
      });

      expect(result.tiltDegrees).toBe(2.1);
      expect(result.isCompliant).toBe(false);
      expect(result.status).toBe('rejected_deviation');
      // Raise the nuts opposite the lean by 300 mm × tan(2.1°) ≈ 11 mm.
      expect(result.correction).toEqual({
        leanSide: 'NE',
        raiseSide: 'SW',
        heightMm: 11,
        turns: 4.4,
      });
    });
  });

  describe('AC Electrical Voltage Drop (NF C 17-200)', () => {
    it('should verify 230V single-phase voltage drop under 3%', () => {
      const result = calculateElectricalNetwork({
        circuitVoltage: 230,
        cableLengthMeters: 80,
        totalLuminairesCount: 5,
        wattagePerLuminaire: 80,
        conductorMaterial: 'copper',
        maxAllowableVoltageDropPct: 3,
      });

      expect(result.totalPowerWatts).toBe(400);
      expect(result.actualVoltageDropPct).toBeLessThan(3.0);
      expect(result.isVoltageDropAcceptable).toBe(true);
      expect(result.recommendedBreakerRatingAmps).toBeGreaterThan(0);
    });
  });

  describe('Trigonometry & GPS Distance', () => {
    it('should compute distance and height from camera pitch angle', () => {
      // Eye height 1.6 m, looking 20° down at the base: 1.6 / tan(20°) ≈ 4.4 m.
      const dist = calculateDistanceToTargetBase(20, 1.6);
      expect(dist).toBe(4.4);

      // 30° up to the top: 4.4 × tan(30°) + 1.6 ≈ 4.1 m.
      expect(calculatePoleHeightFromAngle(dist, 30, 1.6)).toBe(4.1);
    });

    it('should measure an 8 m pole from 10 m away', () => {
      // Base 9.4° below the horizon, top 34.6° above, at 1.65 m eye height.
      const { distanceMeters, heightMeters } = measurePoleHeight(
        1.65,
        9.36,
        34.6,
      );
      expect(distanceMeters).toBeCloseTo(10, 0);
      expect(heightMeters).toBeCloseTo(8.5, 0);
    });

    it('should compute accurate Haversine distance between two coordinates', () => {
      // Tunis to La Marsa (~16 km)
      const distM = calculateHaversineDistanceMeters(
        36.8065,
        10.1815,
        36.8782,
        10.3247,
      );
      expect(distM).toBeGreaterThan(14000);
      expect(distM).toBeLessThan(18000);
    });
  });

  describe('Calendar & Email Export', () => {
    const sampleProject: ProjectItem = {
      id: 'proj-01',
      title: 'Chantier Boulevard Sud',
      clientOrMunicipality: 'Ville Moderne',
      locationName: 'Avenue Principale',
      gpsCenter: { lat: 36.8, lng: 10.2 },
      stage: 'foundations',
      startDate: '2026-11-01',
      commissioningDeadline: '2026-12-15',
      roadWidthMeters: 7,
      roadClass: 'M3',
      lightingType: 'mixed',
      windZone: 2,
      defaultSoil: 'compact_gravel',
      engineerName: 'Ahmed H.',
      engineerEmail: 'engineer@example.com',
      poles: [],
      milestones: [],
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    };

    const sampleMilestone: MilestoneItem = {
      id: 'm1',
      projectId: 'proj-01',
      title: 'Fondations Coulage Béton',
      date: '2026-11-05',
      category: 'foundation_curing',
      completed: false,
      notes: 'Test affaissement Abrams requis',
    };

    const copy: ReminderCopy = {
      project: 'Project',
      client: 'Client',
      location: 'Site',
      engineer: 'Engineer',
      notes: 'Notes',
      noNotes: 'None',
      date: 'Date',
      poles: 'Poles',
      dayBefore: 'Tomorrow',
      twoHoursBefore: 'In two hours',
      emailSubject: 'Site reminder',
      emailGreeting: 'Hello,',
      emailIntro: 'A reminder:',
      emailChecklist: ['Check verticality'],
      emailSignOff: 'Regards,',
    };

    it('should generate valid iCalendar format with events and alarms', () => {
      const ics = generateIcsCalendarEvent(
        sampleProject,
        sampleMilestone,
        copy,
      );
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('Fondations Coulage Béton');
      expect(ics).toContain('BEGIN:VALARM');
      expect(ics).toContain('END:VCALENDAR');
      // Commas and semicolons are escaped inside property values.
      expect(ics).toContain(
        'DESCRIPTION:Project: Chantier Boulevard Sud\\nClient',
      );
    });

    it('should generate valid mailto link with encoded subject and body', () => {
      const mailto = formatMilestoneMailtoUrl(
        sampleProject,
        sampleMilestone,
        copy,
        'engineer@example.com',
      );
      expect(mailto).toContain('mailto:engineer@example.com');
      expect(mailto).toContain('subject=');
      expect(mailto).toContain('Fondations');
    });
  });
});
