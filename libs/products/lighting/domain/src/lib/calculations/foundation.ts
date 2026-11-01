import {
  CalcNote,
  FoundationCalculationParams,
  FoundationCalculationResult,
  SoilType,
  WindZone,
} from '../models/lighting.models';

/**
 * Soil bearing characteristics according to Eurocode 7 / French DTU 13.12.
 */
interface SoilSpecs {
  bearingCapacityKPa: number; // admissible pressure
  depthFactor: number; // multiplier for depth
  lateralResistanceCoefficient: number;
}

const SOIL_SPECS: Record<SoilType, SoilSpecs> = {
  rock: {
    bearingCapacityKPa: 500,
    depthFactor: 0.85,
    lateralResistanceCoefficient: 1.5,
  },
  compact_gravel: {
    bearingCapacityKPa: 300,
    depthFactor: 0.95,
    lateralResistanceCoefficient: 1.2,
  },
  firm_clay: {
    bearingCapacityKPa: 180,
    depthFactor: 1.05,
    lateralResistanceCoefficient: 1.0,
  },
  soft_clay_silt: {
    bearingCapacityKPa: 100,
    depthFactor: 1.25,
    lateralResistanceCoefficient: 0.75,
  },
  loose_sand: {
    bearingCapacityKPa: 120,
    depthFactor: 1.2,
    lateralResistanceCoefficient: 0.8,
  },
};

/**
 * Wind pressure values according to Eurocode 1 (EN 1991-1-4) / NV65 in daN/m² (approx 10 N/m² = 1 daN/m²).
 */
const WIND_ZONE_SPECS: Record<
  WindZone,
  { dynamicPressureDanM2: number; speedKmH: number }
> = {
  1: { dynamicPressureDanM2: 50, speedKmH: 103 }, // sheltered inland
  2: { dynamicPressureDanM2: 65, speedKmH: 118 }, // open plains
  3: { dynamicPressureDanM2: 85, speedKmH: 135 }, // coast, exposed valleys
  4: { dynamicPressureDanM2: 105, speedKmH: 150 }, // exposed shore, islands, high relief
};

/**
 * Calculates structural foundation requirements and verifies proposed hole excavation depth.
 */
export function calculateFoundation(
  params: FoundationCalculationParams,
): FoundationCalculationResult {
  const H = Math.max(3, params.poleHeightMeters);
  const soilKey = params.soilType in SOIL_SPECS ? params.soilType : 'firm_clay';
  const soil = SOIL_SPECS[soilKey] ?? SOIL_SPECS['firm_clay'];

  const rawZone =
    typeof params.windZone === 'number'
      ? params.windZone
      : parseInt(String(params.windZone).replace(/\D/g, ''), 10);
  const windKey = (rawZone >= 1 && rawZone <= 4 ? rawZone : 2) as WindZone;
  const wind = WIND_ZONE_SPECS[windKey] ?? WIND_ZONE_SPECS[2];

  // Aerodynamic drag areas (m²):
  // 1. Pole shaft projected area:
  const topDiaM = (params.poleDiameterTopMm ?? 76) / 1000;
  const baseDiaM = (params.poleDiameterBaseMm ?? 160 + (H - 4) * 12) / 1000;
  const poleShaftAreaM2 = ((topDiaM + baseDiaM) / 2) * H;
  const poleCd = params.poleMaterial === 'aluminum' ? 0.65 : 0.75;

  // 2. Luminaire head projected area:
  const luminaireAreaM2 = 0.18;
  const luminaireCd = 1.0;

  // 3. Solar panel sail area (crucial for solar street lights):
  const panelAreaM2 = params.hasSolarPanel
    ? Math.max(0.6, params.solarPanelAreaM2 ?? (H >= 8 ? 1.6 : 1.0))
    : 0;
  const panelCd = 1.25; // inclined flat plate aerodynamic coefficient

  // Wind force (daN) on each part: F = q_p × A × Cd
  const fShaft = wind.dynamicPressureDanM2 * poleShaftAreaM2 * poleCd;
  const fLum = wind.dynamicPressureDanM2 * luminaireAreaM2 * luminaireCd;
  const fPanel = wind.dynamicPressureDanM2 * panelAreaM2 * panelCd;

  // Overturning moment at ground level M_overturn (daN.m):
  // Lever arms: Shaft center of pressure at ~0.55*H, Luminaire at H, Solar panel at H
  const momentShaft = fShaft * (H * 0.55);
  const momentLum = fLum * H;
  const momentPanel = fPanel * (H - 0.2); // top bracket
  const overturningMomentDanM = Math.round(
    momentShaft + momentLum + momentPanel,
  );

  // Minimum excavation depth:
  // Baseline rule of thumb: D_base = H / 10 + 0.50m (e.g. 8m -> 1.30m, 10m -> 1.50m)
  let minDepth = H / 10 + 0.5;

  // Additional factor for solar panel top mass & wind drag:
  if (params.hasSolarPanel) {
    minDepth += 0.25; // 25cm extra foundation depth needed for solar streetlights
  }

  // Multiply by soil condition and wind zone severity:
  const windFactor = 1 + (windKey - 1) * 0.08;
  minDepth = minDepth * soil.depthFactor * windFactor;

  // Round to nearest 5cm
  const minRecommendedDepthMeters = parseFloat(
    (Math.ceil(minDepth * 20) / 20).toFixed(2),
  );

  // Concrete Massif (foundation block) dimensions:
  // For stability, block width W_b & length L_b must provide sufficient stabilizing moment:
  // M_stab = Weight_concrete * (W_b / 2) >= SF * M_overturn
  // Typical rule of thumb: square base with side = 0.65 to 0.9 * Depth
  const blockSide = Math.max(
    0.6,
    parseFloat(
      (Math.ceil(minRecommendedDepthMeters * 0.68 * 20) / 20).toFixed(2),
    ),
  );
  const recommendedBlockWidthMeters = blockSide;
  const recommendedBlockLengthMeters = blockSide;

  const recommendedVolumeM3 = parseFloat(
    (
      recommendedBlockWidthMeters *
      recommendedBlockLengthMeters *
      minRecommendedDepthMeters
    ).toFixed(2),
  );

  // Concrete density ~ 2,400 kg/m³
  const minConcreteMassKg = Math.round(recommendedVolumeM3 * 2400);

  // Anchor bolts (four, class 8.8) sized by the overturning moment:
  const anchorBolts: FoundationCalculationResult['anchorBolts'] =
    overturningMomentDanM < 800
      ? { size: 'M16', lengthMm: 500, pitchMm: 200 }
      : overturningMomentDanM < 1600
        ? { size: 'M20', lengthMm: 600, pitchMm: 300 }
        : overturningMomentDanM < 2800
          ? { size: 'M24', lengthMm: 700, pitchMm: 400 }
          : { size: 'M27', lengthMm: 800, pitchMm: 450 };

  // Safety factor calculation for proposed or recommended depth:
  // Downward gravitational weight of concrete (1 kg ~ 1 daN) + soil passive resistance
  const actualDepth = params.excavationDepthMeters ?? minRecommendedDepthMeters;
  const actualVolume =
    recommendedBlockWidthMeters * recommendedBlockLengthMeters * actualDepth;
  const actualMassKg = actualVolume * 2400; // daN downward force
  const weightStabilizingMoment =
    actualMassKg * (recommendedBlockWidthMeters / 2);
  // Soil lateral passive resistance moment on buried massif:
  const soilLateralMoment =
    soil.bearingCapacityKPa *
    0.25 *
    recommendedBlockWidthMeters *
    (actualDepth * actualDepth) *
    soil.lateralResistanceCoefficient;
  const stabilizingMomentDanM = weightStabilizingMoment + soilLateralMoment;
  const safetyFactor = parseFloat(
    (stabilizingMomentDanM / Math.max(1, overturningMomentDanM)).toFixed(2),
  );

  // Verification of user's proposed depth
  const isDepthValid = actualDepth >= minRecommendedDepthMeters - 0.05; // 5cm tolerance
  let depthComplianceVerdict: 'safe' | 'marginal' | 'unsafe';
  if (actualDepth >= minRecommendedDepthMeters) {
    depthComplianceVerdict = 'safe';
  } else if (actualDepth >= minRecommendedDepthMeters - 0.15) {
    depthComplianceVerdict = 'marginal';
  } else {
    depthComplianceVerdict = 'unsafe';
  }

  const notes: CalcNote[] = [];
  if (params.excavationDepthMeters !== undefined) {
    notes.push(
      actualDepth < minRecommendedDepthMeters
        ? {
            code: 'foundation.depthShort',
            severity: 'error',
            values: {
              depth: actualDepth,
              min: minRecommendedDepthMeters,
              wind: wind.speedKmH,
            },
          }
        : {
            code: 'foundation.depthOk',
            severity: 'ok',
            values: { depth: actualDepth, min: minRecommendedDepthMeters },
          },
    );
  }
  if (params.hasSolarPanel) {
    notes.push({
      code: 'foundation.solarDrag',
      severity: 'info',
      values: { area: panelAreaM2, force: Math.round(fPanel) },
    });
  }
  if (
    params.soilType === 'soft_clay_silt' ||
    params.soilType === 'loose_sand'
  ) {
    notes.push({
      code: 'foundation.weakSoil',
      severity: 'warn',
      values: { soil: params.soilType },
    });
  }
  if (safetyFactor < 1.5) {
    notes.push({
      code: 'foundation.lowSafety',
      severity: 'error',
      values: { factor: safetyFactor },
    });
  }

  return {
    minRecommendedDepthMeters,
    recommendedBlockWidthMeters,
    recommendedBlockLengthMeters,
    recommendedVolumeM3,
    minConcreteMassKg,
    soilBearingCapacityKPa: soil.bearingCapacityKPa,
    windPressureDanM2: wind.dynamicPressureDanM2,
    overturningMomentDanM,
    windSpeedKmH: wind.speedKmH,
    actualDepthMeters: actualDepth,
    safetyFactor,
    anchorBolts,
    isDepthValid,
    depthComplianceVerdict,
    notes,
  };
}
