import {
  ElectricalCalculationResult,
  ElectricalParams,
} from '../models/lighting.models';

const STANDARD_CABLE_SECTIONS_MM2 = [2.5, 4, 6, 10, 16, 25, 35, 50];

/**
 * Calculates electrical cable sizing and line voltage drop for conventional AC street lighting circuits.
 */
export function calculateElectricalNetwork(
  params: ElectricalParams,
): ElectricalCalculationResult {
  const vNominal = params.circuitVoltage; // 230V or 400V
  const lengthM = Math.max(10, params.cableLengthMeters);
  const count = Math.max(1, params.totalLuminairesCount);
  const wattPerLum = Math.max(10, params.wattagePerLuminaire);
  const totalPowerWatts = count * wattPerLum;
  const cosPhi = 0.95; // LED driver power factor

  // Resistivity: Copper = 0.0225 ohm.mm²/m at 50°C, Aluminum = 0.036 ohm.mm²/m
  const rho = params.conductorMaterial === 'copper' ? 0.0225 : 0.036;

  // Total current I (Amperes):
  // Single phase 230V: I = P / (V * cosPhi)
  // Three phase 400V: I = P / (sqrt(3) * V * cosPhi)
  let totalCurrentAmperes: number;
  if (vNominal === 400) {
    totalCurrentAmperes = parseFloat(
      (totalPowerWatts / (Math.sqrt(3) * 400 * cosPhi)).toFixed(2),
    );
  } else {
    totalCurrentAmperes = parseFloat(
      (totalPowerWatts / (230 * cosPhi)).toFixed(2),
    );
  }

  // Permissible voltage drop percentage (default 3% for public lighting, max 5%)
  const maxDropPct = params.maxAllowableVoltageDropPct || 3.0;
  const maxDropVolts = (vNominal * maxDropPct) / 100;

  // In a street lighting circuit with uniformly distributed luminaires along the line:
  // The center of gravity of the load is approximately at length / 2!
  const effectiveLengthM = lengthM * 0.55;

  // Minimum cross-section S_min (mm²):
  // For single phase 230V: Delta_U = (2 * rho * L_eff * I * cosPhi) / S
  // => S = (2 * rho * L_eff * I * cosPhi) / Delta_U_max
  // For three phase 400V balanced: Delta_U = (sqrt(3) * rho * L_eff * I * cosPhi) / S
  const multiplier = vNominal === 400 ? Math.sqrt(3) : 2.0;
  const theoreticalSection =
    (multiplier * rho * effectiveLengthM * totalCurrentAmperes * cosPhi) /
    maxDropVolts;

  // Find standard commercial cable cross-section (minimum 6mm² required by NF C 17-200 for public lighting mechanical strength underground):
  const minAllowedSection = Math.max(6, theoreticalSection);
  const recommendedCrossSectionMm2 =
    STANDARD_CABLE_SECTIONS_MM2.find((s) => s >= minAllowedSection) ??
    Math.ceil(minAllowedSection / 10) * 10;

  // Actual voltage drop with chosen standard cable:
  const actualVoltageDropVolts = parseFloat(
    (
      (multiplier * rho * effectiveLengthM * totalCurrentAmperes * cosPhi) /
      recommendedCrossSectionMm2
    ).toFixed(2),
  );
  const actualVoltageDropPct = parseFloat(
    ((actualVoltageDropVolts / vNominal) * 100).toFixed(2),
  );
  const isVoltageDropAcceptable = actualVoltageDropPct <= maxDropPct;

  // Recommended Circuit Breaker (Disjoncteur courbe C ou D pour l'appel de courant des drivers LED):
  const standardBreakers = [10, 16, 20, 25, 32, 40, 63];
  const requiredBreaker = totalCurrentAmperes * 1.35; // 35% margin for LED inrush current
  const recommendedBreakerRatingAmps =
    standardBreakers.find((b) => b >= requiredBreaker) ?? 63;

  return {
    totalPowerWatts,
    totalCurrentAmperes,
    recommendedCrossSectionMm2,
    actualVoltageDropPct,
    actualVoltageDropVolts,
    isVoltageDropAcceptable,
    recommendedBreakerRatingAmps,
    earthResistanceTargetOhms: 10, // <= 10 ohms according to NF C 17-200
  };
}
