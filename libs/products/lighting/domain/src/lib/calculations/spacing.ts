import {
  CalcNote,
  RoadLightingClass,
  SpacingCalculationParams,
  SpacingCalculationResult,
} from '../models/lighting.models';

/**
 * Standard thresholds from EN 13201-2 for road lighting classes.
 */
interface RoadClassStandard {
  minAverageLux: number; // E_avg (lux)
  minUniformity: number; // U_0 overall uniformity (0-1)
  description: string;
}

const ROAD_STANDARDS: Record<RoadLightingClass, RoadClassStandard> = {
  // Motorized high-speed roads (luminance classes approximated to lux equivalent)
  M1: {
    minAverageLux: 30,
    minUniformity: 0.4,
    description: 'Motorways & expressways, high speed (>100 km/h)',
  },
  M2: {
    minAverageLux: 22,
    minUniformity: 0.4,
    description: 'Primary distributors, multi-lane, 80-100 km/h',
  },
  M3: {
    minAverageLux: 15,
    minUniformity: 0.4,
    description: 'Secondary distributors, high traffic, 60-80 km/h',
  },
  M4: {
    minAverageLux: 11,
    minUniformity: 0.4,
    description: 'Connecting roads, moderate traffic, 50-70 km/h',
  },
  M5: {
    minAverageLux: 7.5,
    minUniformity: 0.35,
    description: 'Local roads with moderate traffic, 40-50 km/h',
  },
  M6: {
    minAverageLux: 5.0,
    minUniformity: 0.35,
    description: 'Rural or low-traffic access roads, <50 km/h',
  },

  // Conflict zones (roundabouts, intersections, toll plazas, pedestrian crossings)
  C0: {
    minAverageLux: 50,
    minUniformity: 0.4,
    description: 'Complex interchanges, high pedestrian/vehicle conflict',
  },
  C1: {
    minAverageLux: 30,
    minUniformity: 0.4,
    description: 'Major urban roundabouts & signalized intersections',
  },
  C2: {
    minAverageLux: 20,
    minUniformity: 0.4,
    description: 'Medium urban intersections & town entry squares',
  },
  C3: {
    minAverageLux: 15,
    minUniformity: 0.4,
    description: 'Commercial district junctions, moderate conflict',
  },
  C4: {
    minAverageLux: 10,
    minUniformity: 0.4,
    description: 'Minor intersections & residential junctions',
  },
  C5: {
    minAverageLux: 7.5,
    minUniformity: 0.4,
    description: 'Suburban dead-ends & low-conflict plazas',
  },

  // Pedestrian & residential areas (Illuminance classes)
  P1: {
    minAverageLux: 15.0,
    minUniformity: 0.3,
    description: 'Prestige pedestrian walkways, shopping arcades',
  },
  P2: {
    minAverageLux: 10.0,
    minUniformity: 0.25,
    description: 'Busy pedestrian routes, city center streets',
  },
  P3: {
    minAverageLux: 7.5,
    minUniformity: 0.2,
    description: 'Suburban residential streets with moderate traffic',
  },
  P4: {
    minAverageLux: 5.0,
    minUniformity: 0.2,
    description: 'Quiet residential access roads, low traffic',
  },
  P5: {
    minAverageLux: 3.0,
    minUniformity: 0.15,
    description: 'Village alleys, pedestrian paths, very low speed',
  },
  P6: {
    minAverageLux: 2.0,
    minUniformity: 0.15,
    description: 'Rural residential lanes, nocturnal preservation areas',
  },
};

export function getRoadClassStandard(
  roadClass: RoadLightingClass,
): RoadClassStandard {
  return ROAD_STANDARDS[roadClass] ?? ROAD_STANDARDS['M4'];
}

/**
 * Calculates and validates pole spacing according to EN 13201 standards.
 */
export function calculatePoleSpacing(
  params: SpacingCalculationParams,
): SpacingCalculationResult {
  const H = Math.max(3, params.mountingHeightMeters);
  const W = Math.max(2, params.roadWidthMeters);
  const S = Math.max(5, params.spacingMeters);
  const lumens = Math.max(500, params.luminaireLumens);
  const MF = Math.min(1.0, Math.max(0.5, params.maintenanceFactor || 0.8));

  // S/H ratio
  const ratio = parseFloat((S / H).toFixed(2));

  // Determine standard requirements
  const std = getRoadClassStandard(params.roadClass);

  // Utilization factor (UF): in road lighting, typically 0.35 to 0.52 depending on road width to height ratio W/H
  const wOverH = W / H;
  const UF = params.utilizationFactor
    ? params.utilizationFactor
    : Math.min(0.52, Math.max(0.3, 0.42 + (wOverH - 1.0) * 0.05));

  // Lumen method calculation for average illuminance E_avg (lux):
  // E_avg = (Lumens * UF * MF) / (RoadWidth * Spacing)
  const illuminatedArea = W * S;
  const estimatedAverageLux = parseFloat(
    ((lumens * UF * MF) / illuminatedArea).toFixed(1),
  );

  // Uniformity estimation:
  // In street lighting, as S/H exceeds 3.5, uniformity drops quickly.
  // Empirical curve matching CIE 140 / EN 13201 simulations:
  let estimatedUniformity: number;
  if (ratio <= 2.8) {
    estimatedUniformity = 0.55;
  } else if (ratio <= 3.5) {
    estimatedUniformity = parseFloat((0.55 - (ratio - 2.8) * 0.15).toFixed(2));
  } else if (ratio <= 4.2) {
    estimatedUniformity = parseFloat((0.44 - (ratio - 3.5) * 0.18).toFixed(2));
  } else if (ratio <= 5.0) {
    estimatedUniformity = parseFloat((0.31 - (ratio - 4.2) * 0.16).toFixed(2));
  } else {
    estimatedUniformity = Math.max(
      0.1,
      parseFloat((0.18 - (ratio - 5.0) * 0.05).toFixed(2)),
    );
  }

  // Recommended spacing range: optimal S/H is typically 3.2 to 4.0
  const recommendedSpacingMinMeters = Math.round(H * 3.0);
  const recommendedSpacingMaxMeters = Math.round(H * 4.2);

  // Evaluation
  let ratioEvaluation: 'optimal' | 'acceptable' | 'excessive' | 'too_close';
  if (ratio < 2.5) {
    ratioEvaluation = 'too_close';
  } else if (ratio >= 3.0 && ratio <= 4.0) {
    ratioEvaluation = 'optimal';
  } else if (ratio <= 4.5) {
    ratioEvaluation = 'acceptable';
  } else {
    ratioEvaluation = 'excessive';
  }

  const meetsLux = estimatedAverageLux >= std.minAverageLux;
  const meetsUniformity = estimatedUniformity >= std.minUniformity;
  const isCompliant = meetsLux && meetsUniformity && ratio <= 4.5;

  const notes: CalcNote[] = [];
  if (ratio > 4.5) {
    notes.push({
      code: 'spacing.excessive',
      severity: 'warn',
      values: { ratio },
    });
  } else if (ratio < 2.8) {
    notes.push({
      code: 'spacing.tooClose',
      severity: 'info',
      values: { ratio, suggested: Math.round(H * 3.5) },
    });
  }
  if (!meetsLux) {
    const requiredLumens = Math.round(
      (std.minAverageLux * illuminatedArea) / (UF * MF),
    );
    notes.push({
      code: 'spacing.lowLux',
      severity: 'error',
      values: {
        lux: estimatedAverageLux,
        required: std.minAverageLux,
        roadClass: params.roadClass,
        lumens: requiredLumens,
      },
    });
  }
  if (!meetsUniformity) {
    notes.push({
      code: 'spacing.lowUniformity',
      severity: 'error',
      values: { u0: estimatedUniformity, required: std.minUniformity },
    });
  }
  if (isCompliant) {
    notes.push({
      code: 'spacing.compliant',
      severity: 'ok',
      values: { roadClass: params.roadClass },
    });
  }

  return {
    spacingRatio: ratio,
    ratioEvaluation,
    estimatedAverageLux,
    estimatedUniformity,
    requiredAverageLux: std.minAverageLux,
    requiredUniformity: std.minUniformity,
    isCompliant,
    meetsLux,
    meetsUniformity,
    utilizationFactor: parseFloat(UF.toFixed(2)),
    recommendedSpacingMinMeters,
    recommendedSpacingMaxMeters,
    notes,
  };
}
