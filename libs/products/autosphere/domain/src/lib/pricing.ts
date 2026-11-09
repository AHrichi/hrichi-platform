import type {
  FinanceSummary,
  InteriorTrim,
  InteriorUpholstery,
  RangeSimulation,
  VehicleColorway,
  VehicleModel,
  VehiclePackage,
  VehicleTrim,
  VehicleWheel,
} from './model';

/**
 * Computes the total vehicle price based on user configuration.
 */
export function calculateTotalPrice(
  model: VehicleModel,
  trim: VehicleTrim,
  color: VehicleColorway,
  wheel: VehicleWheel,
  packages: VehiclePackage[],
  upholstery?: InteriorUpholstery,
  interiorTrim?: InteriorTrim,
): number {
  const packagesTotal = packages.reduce((sum, p) => sum + p.priceDelta, 0);
  const upholsteryDelta = upholstery?.priceDelta ?? 0;
  const trimDelta = interiorTrim?.priceDelta ?? 0;

  return (
    model.basePrice +
    trim.priceDelta +
    color.priceDelta +
    wheel.priceDelta +
    packagesTotal +
    upholsteryDelta +
    trimDelta
  );
}

/**
 * Calculates monthly lease and loan payments based on total price, down payment, and term.
 */
export function calculateFinance(
  cashPrice: number,
  downPaymentPercent = 10,
  termMonths: 24 | 36 | 48 | 60 = 48,
  annualRate = 0.039,
): FinanceSummary {
  const downPayment = Math.round(cashPrice * (downPaymentPercent / 100));
  const residualFactor =
    termMonths === 24
      ? 0.65
      : termMonths === 36
        ? 0.55
        : termMonths === 48
          ? 0.45
          : 0.38;
  const residualValue = Math.round(cashPrice * residualFactor);

  // Lease monthly calculation (depreciation + money factor)
  const depreciation = (cashPrice - downPayment - residualValue) / termMonths;
  const monthlyFinanceCharge =
    ((cashPrice - downPayment + residualValue) / 2) * (annualRate / 12);
  const monthlyLease = Math.max(
    0,
    Math.round(depreciation + monthlyFinanceCharge),
  );

  // Standard auto loan amortization (P * r * (1+r)^n / ((1+r)^n - 1))
  const financedPrincipal = Math.max(0, cashPrice - downPayment);
  const monthlyInterestRate = annualRate / 12;
  const compoundFactor = Math.pow(1 + monthlyInterestRate, termMonths);
  const monthlyLoan =
    financedPrincipal > 0
      ? Math.round(
          (financedPrincipal * monthlyInterestRate * compoundFactor) /
            (compoundFactor - 1),
        )
      : 0;

  const totalCostOfOwnership = Math.round(
    downPayment + monthlyLease * termMonths,
  );

  return {
    cashPrice,
    downPayment,
    termMonths,
    monthlyLease,
    monthlyLoan,
    annualInterestRate: Math.round(annualRate * 1000) / 10,
    residualValue,
    totalCostOfOwnership,
    estimatedDeliveryWeeks: 6,
  };
}

/**
 * Simulates real-world EV battery range and 800V fast-charging throughput
 * accounting for ambient temperature, driving cycle/speed, and HVAC energy draw.
 */
export function simulateRange(
  trim: VehicleTrim,
  wheel: VehicleWheel,
  ambientTempC = 20,
  drivingSpeed: 'city' | 'mixed' | 'highway' = 'mixed',
  acHeatingOn = true,
): RangeSimulation {
  const baseWltp = Math.max(100, trim.wltpRangeKm + wheel.rangeImpactKm);

  // Temperature efficiency curve (optimal between 18°C and 24°C)
  let tempFactor = 1.0;
  if (ambientTempC < 18) {
    // Sub-zero / cold loss due to battery internal impedance
    tempFactor -= Math.min(0.25, ((18 - ambientTempC) * 0.8) / 100);
    if (acHeatingOn) tempFactor -= 0.05; // PTC cabin heater draw
  } else if (ambientTempC > 24) {
    // AC cooling draw
    tempFactor -= Math.min(0.12, ((ambientTempC - 24) * 0.6) / 100);
    if (acHeatingOn) tempFactor -= 0.04;
  }

  // Driving speed / aerodynamics impact
  const speedFactor =
    drivingSpeed === 'city' ? 1.12 : drivingSpeed === 'mixed' ? 1.0 : 0.78;

  const simulatedRangeKm = Math.round(baseWltp * tempFactor * speedFactor);
  const consumptionKwhPer100Km = Number(
    ((trim.batteryCapacityKwh / simulatedRangeKm) * 100).toFixed(1),
  );

  // 800V ultra-fast charging calculation
  // High-power 320 kW to 350 kW 800V architecture charges 10% to 80% (70% capacity)
  const kwhTo80 = trim.batteryCapacityKwh * 0.7;
  const avgChargingPowerKw = Math.min(trim.chargingRateKw * 0.75, 270);
  const fastCharge10to80Min = Math.round((kwhTo80 / avgChargingPowerKw) * 60);
  // Range added in 10 minutes
  const kwhIn10Min = avgChargingPowerKw * (10 / 60);
  const rangeAdded10MinKm = Math.round(
    kwhIn10Min / (consumptionKwhPer100Km / 100),
  );

  return {
    simulatedRangeKm,
    wltpBaseRangeKm: baseWltp,
    consumptionKwhPer100Km,
    temperatureImpactPercent: Math.round((tempFactor - 1) * 100),
    speedImpactPercent: Math.round((speedFactor - 1) * 100),
    fastCharge10to80Min,
    rangeAdded10MinKm,
  };
}
