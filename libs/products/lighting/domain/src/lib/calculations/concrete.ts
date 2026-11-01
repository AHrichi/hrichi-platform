import {
  CalcNote,
  ConcreteClass,
  ConcreteExposure,
  ConcreteMixParams,
  ConcreteMixValidationResult,
  SlumpClass,
} from '../models/lighting.models';

/**
 * Standard minimum cement content (kg/m³) and maximum W/C ratio according to NF EN 206 / Eurocode 2.
 */
interface ExposureRequirement {
  minCementKgM3: number;
  maxWaterCementRatio: number;
  minClass: ConcreteClass;
}

const EXPOSURE_STANDARDS: Record<ConcreteExposure, ExposureRequirement> = {
  XC1_dry: {
    minCementKgM3: 280,
    maxWaterCementRatio: 0.65,
    minClass: 'C20_25',
  },
  XC2_wet: {
    minCementKgM3: 300,
    maxWaterCementRatio: 0.6,
    minClass: 'C25_30',
  },
  XC2: {
    minCementKgM3: 300,
    maxWaterCementRatio: 0.6,
    minClass: 'C25_30',
  },
  XC4_cycling: {
    minCementKgM3: 340,
    maxWaterCementRatio: 0.5,
    minClass: 'C25_30',
  },
  XS1_marine: {
    minCementKgM3: 360,
    maxWaterCementRatio: 0.45,
    minClass: 'C30_37',
  },
  XF1_frost: {
    minCementKgM3: 340,
    maxWaterCementRatio: 0.5,
    minClass: 'C25_30',
  },
};

/**
 * Eurocode 2 hardening formula: calculates strength gain percentage at t days.
 * beta_cc(t) = exp(s * (1 - sqrt(28 / t))) where s = 0.25 for normal/rapid cement (CEM II 42.5 N/R).
 */
export function calculateConcreteCuringStrengthPct(ageDays: number): number {
  if (ageDays <= 0) return 0;
  if (ageDays >= 28) return 100;
  const s = 0.25; // standard CEM II cement hardening coefficient
  const beta = Math.exp(s * (1 - Math.sqrt(28 / ageDays)));
  return Math.min(100, Math.round(beta * 100));
}

/**
 * Classifies slump measured with Abrams Cone (cm) into EN 206 consistency classes.
 */
export function classifySlump(slumpCm: number): {
  slumpClass: SlumpClass;
  isOptimalForPoleMassif: boolean;
} {
  // S2 (5-9 cm) and S3 (10-15 cm) fill a narrow excavation without segregating.
  if (slumpCm < 4) {
    return { slumpClass: 'S1', isOptimalForPoleMassif: false };
  } else if (slumpCm < 10) {
    return { slumpClass: 'S2', isOptimalForPoleMassif: true };
  } else if (slumpCm <= 15) {
    return { slumpClass: 'S3', isOptimalForPoleMassif: true };
  }
  return { slumpClass: 'S4', isOptimalForPoleMassif: false };
}

/**
 * Verifies on-site concrete mix formulation against EN 206 standards for pole foundations.
 */
export function validateConcreteMix(
  params: ConcreteMixParams,
): ConcreteMixValidationResult {
  const volM3 = Math.max(0.1, params.volumeM3);
  const expStd =
    EXPOSURE_STANDARDS[params.exposure] ?? EXPOSURE_STANDARDS['XC4_cycling'];

  // Target standard cement per m³
  const requiredCementMinKgM3 = expStd.minCementKgM3;
  const maxWaterCementRatio = expStd.maxWaterCementRatio;

  // Provided values (default to standard 350 kg/m³ and 0.50 W/C if not manually tested):
  const providedCementKgM3 = params.measuredCementKg ?? 350;
  const providedWaterCementRatio =
    params.waterCementRatio ??
    (params.measuredWaterLiters
      ? parseFloat((params.measuredWaterLiters / providedCementKgM3).toFixed(2))
      : 0.5);

  // Slump test analysis:
  const slumpCm = params.slumpTestCm ?? 12; // default 12cm (S3)
  const slumpData = classifySlump(slumpCm);

  // Age curing check:
  const curingAge = params.curingAgeDays ?? 28;
  const currentStrengthPctOf28Days =
    calculateConcreteCuringStrengthPct(curingAge);

  // Validation rules:
  const isCementDosageValid = providedCementKgM3 >= requiredCementMinKgM3 - 10;
  const isWaterRatioValid =
    providedWaterCementRatio <= maxWaterCementRatio + 0.03;
  const isSlumpAcceptable = slumpData.isOptimalForPoleMassif;

  // Pole erection requires at least 70% compressive strength (usually 7 days at 20°C):
  const isErectionPermitted = currentStrengthPctOf28Days >= 70;
  // Final full commissioning / wind load requires 100% (28 days):
  const isFullCommissioningPermitted = currentStrengthPctOf28Days >= 100;

  let overallCompliance: 'compliant' | 'warning' | 'non_compliant';
  if (isCementDosageValid && isWaterRatioValid && isSlumpAcceptable) {
    overallCompliance = 'compliant';
  } else if (
    !isCementDosageValid ||
    providedWaterCementRatio > maxWaterCementRatio + 0.08
  ) {
    overallCompliance = 'non_compliant';
  } else {
    overallCompliance = 'warning';
  }

  // Standard C25/30 Mix Recipe per m³:
  // Cement 350 kg (10 bags 35kg), Sand 0/4: 750 kg, Gravel 4/20: 1150 kg, Water: 175 L (E/C = 0.50)
  const cementPerM3 = Math.max(300, providedCementKgM3);
  const sandPerM3 = 750;
  const gravelPerM3 = 1150;
  const waterPerM3 = Math.round(cementPerM3 * providedWaterCementRatio);

  const totalCementKg = Math.round(cementPerM3 * volM3);
  const totalCementBags35Kg = Math.ceil(totalCementKg / 35);
  const totalSandTonnes = parseFloat(((sandPerM3 * volM3) / 1000).toFixed(2));
  const totalGravelTonnes = parseFloat(
    ((gravelPerM3 * volM3) / 1000).toFixed(2),
  );
  const totalWaterLiters = Math.round(waterPerM3 * volM3);

  const notes: CalcNote[] = [];
  if (!isCementDosageValid) {
    notes.push({
      code: 'concrete.lowCement',
      severity: 'error',
      values: {
        provided: providedCementKgM3,
        required: requiredCementMinKgM3,
        exposure: params.exposure,
      },
    });
  }
  if (providedWaterCementRatio > maxWaterCementRatio) {
    notes.push({
      code: 'concrete.highWater',
      severity: 'error',
      values: { ratio: providedWaterCementRatio, max: maxWaterCementRatio },
    });
  }
  if (slumpCm > 15) {
    notes.push({
      code: 'concrete.highSlump',
      severity: 'warn',
      values: { slump: slumpCm },
    });
  } else if (slumpCm < 4) {
    notes.push({
      code: 'concrete.lowSlump',
      severity: 'warn',
      values: { slump: slumpCm },
    });
  }
  if (!isErectionPermitted) {
    notes.push({
      code: 'concrete.tooYoung',
      severity: 'error',
      values: { days: curingAge, pct: currentStrengthPctOf28Days },
    });
  } else if (!isFullCommissioningPermitted) {
    notes.push({
      code: 'concrete.notFull',
      severity: 'info',
      values: { days: curingAge, pct: currentStrengthPctOf28Days },
    });
  }

  return {
    requiredCementMinKgM3,
    providedCementKgM3,
    maxWaterCementRatio,
    providedWaterCementRatio,
    slumpClassification: slumpData.slumpClass,
    isSlumpAcceptable,
    currentStrengthPctOf28Days,
    isErectionPermitted,
    isFullCommissioningPermitted,
    isCementDosageValid,
    isWaterRatioValid,
    overallCompliance,
    batchRecipes: {
      perCubicMeter: {
        cementKg: cementPerM3,
        sandKg: sandPerM3,
        gravelKg: gravelPerM3,
        waterLiters: waterPerM3,
      },
      totalJobBatch: {
        cementBags35Kg: totalCementBags35Kg,
        sandTonnes: totalSandTonnes,
        gravelTonnes: totalGravelTonnes,
        waterLiters: totalWaterLiters,
      },
    },
    notes,
  };
}
