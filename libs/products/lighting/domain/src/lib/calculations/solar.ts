import {
  CalcNote,
  SolarSizingParams,
  SolarSizingResult,
} from '../models/lighting.models';

/**
 * Standard commercial solar panel wattage sizes available in the market.
 */
const STANDARD_SOLAR_PANELS_WP = [
  80, 100, 120, 150, 180, 200, 250, 300, 350, 400, 450, 500,
];

/**
 * Standard commercial lithium/gel battery capacities (Ah at standard 12V or 24V).
 */
const STANDARD_BATTERY_AH = [20, 30, 40, 50, 60, 80, 100, 120, 150, 200];

/**
 * Calculates complete solar photovoltaic and battery storage requirements for autonomous street lighting.
 */
export function calculateSolarSizing(
  params: SolarSizingParams,
): SolarSizingResult {
  const ledW = Math.max(10, params.ledWattage);
  const psh = Math.max(2.0, params.peakSunHours);
  const autonomy = Math.max(1, params.autonomyDays);
  const voltage = params.systemVoltage;

  // 1. Calculate effective full-power operating hours from the multi-stage dimming profile:
  // E.g.: 4h @ 100% + 4h @ 30% + 3h @ 60% = 4 + 1.2 + 1.8 = 7.0 effective hours
  const p = params.dimmingProfile;
  const h1 =
    Math.max(0, p.hoursStage1) *
    (Math.min(100, Math.max(0, p.pctStage1)) / 100);
  const h2 =
    Math.max(0, p.hoursStage2) *
    (Math.min(100, Math.max(0, p.pctStage2)) / 100);
  const h3 =
    Math.max(0, p.hoursStage3) *
    (Math.min(100, Math.max(0, p.pctStage3)) / 100);
  const totalProfileHours = p.hoursStage1 + p.hoursStage2 + p.hoursStage3;
  const effectiveFullPowerHours = parseFloat(
    (totalProfileHours > 0
      ? h1 + h2 + h3
      : params.dailyOperatingHours || 10
    ).toFixed(2),
  );

  // Daily energy consumption: E_daily = P_led * EffectiveHours * driver_loss_factor (1.10)
  const driverEfficiency = 0.9;
  const dailyEnergyConsumptionWh = Math.round(
    (ledW * effectiveFullPowerHours) / driverEfficiency,
  );

  // 2. Solar PV Panel Sizing:
  // Performance ratio PR: accounts for dust on glass, temperature loss (PV cells run hot in sun, ~0.4%/°C),
  // wiring drop, and MPPT efficiency. PR is typically 0.72 - 0.78 for streetlights.
  const performanceRatio = 0.75;
  // Wp = E_daily / (PSH * PR)
  const minSolarPanelPeakWatts = Math.round(
    dailyEnergyConsumptionWh / (psh * performanceRatio),
  );

  // Find next commercial panel size:
  const commercialPanelSizeWatts =
    STANDARD_SOLAR_PANELS_WP.find((w) => w >= minSolarPanelPeakWatts) ??
    Math.ceil(minSolarPanelPeakWatts / 50) * 50;

  // 3. Battery Sizing:
  // Depth of Discharge (DoD): LiFePO4 can safely discharge 85%, Gel only 50% to maintain 5-year cycle life
  const maxDischargeDepthPct = params.batteryChemistry === 'LiFePO4' ? 85 : 50;
  const dod = maxDischargeDepthPct / 100;
  const batteryEfficiency = params.batteryChemistry === 'LiFePO4' ? 0.95 : 0.85;

  // Total required battery capacity in Watt-hours:
  // C_Wh = (E_daily * AutonomyDays) / (DoD * efficiency)
  const minBatteryCapacityWh = Math.round(
    (dailyEnergyConsumptionWh * autonomy) / (dod * batteryEfficiency),
  );

  // In Ampere-hours (Ah) at system voltage:
  const minBatteryCapacityAh = Math.round(minBatteryCapacityWh / voltage);

  const commercialBatteryCapacityAh =
    STANDARD_BATTERY_AH.find((ah) => ah >= minBatteryCapacityAh) ??
    Math.ceil(minBatteryCapacityAh / 20) * 20;

  // 4. Charge Controller Sizing:
  // Charge current: I = P_panel / SystemVoltage * safety (1.25)
  const mpptControllerAmpRating = Math.max(
    10,
    Math.ceil((commercialPanelSizeWatts / voltage) * 1.25),
  );

  // 5. Winter Solstice Margin:
  // On the shortest day of the year (Dec 21), PSH is typically 30-40% lower than annual average.
  const winterPsh = psh * 0.65;
  const winterGenerationWh =
    commercialPanelSizeWatts * winterPsh * performanceRatio;
  const winterSolsticeCoveragePct = Math.min(
    150,
    Math.round((winterGenerationWh / dailyEnergyConsumptionWh) * 100),
  );

  // 6. Environmental Impact (CO2 savings):
  // Conventional grid emission factor ~ 0.42 kg CO2 / kWh
  const annualEnergyKwh = (dailyEnergyConsumptionWh * 365) / 1000;
  const co2SavedKgPerYear = Math.round(annualEnergyKwh * 0.42);

  const notes: CalcNote[] = [
    winterSolsticeCoveragePct < 90
      ? {
          code: 'solar.winterShort',
          severity: 'warn',
          values: {
            coverage: winterSolsticeCoveragePct,
            panel: commercialPanelSizeWatts + 50,
          },
        }
      : {
          code: 'solar.winterOk',
          severity: 'ok',
          values: { coverage: winterSolsticeCoveragePct },
        },
    params.batteryChemistry === 'LiFePO4'
      ? { code: 'solar.lifepo4', severity: 'info' }
      : { code: 'solar.gel', severity: 'info' },
    { code: 'solar.co2', severity: 'info', values: { kg: co2SavedKgPerYear } },
  ];

  return {
    dailyEnergyConsumptionWh,
    effectiveFullPowerHours,
    minSolarPanelPeakWatts,
    commercialPanelSizeWatts,
    minBatteryCapacityWh,
    minBatteryCapacityAh,
    commercialBatteryCapacityAh,
    maxDischargeDepthPct,
    mpptControllerAmpRating,
    winterSolsticeCoveragePct,
    co2SavedKgPerYear,
    notes,
  };
}
