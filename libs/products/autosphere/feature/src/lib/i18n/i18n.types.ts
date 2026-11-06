import type { SiteLanguage } from '@ah/shared/state';

export type AutoSphereLanguage = SiteLanguage;

export interface AutoSphereDictionary {
  header: {
    allApps: string;
    brandBadge: string;
    cdaLive: string;
    cdaDraft: string;
    shareBuild: string;
    copied: string;
    exportJson: string;
  };
  hud: {
    lightingDay: string;
    lightingCyber: string;
    lightingXray: string;
    presetThreeQuarters: string;
    presetSide: string;
    presetInterior: string;
    presetWheels: string;
    presetTop: string;
    turntableSpinning: string;
    turntableSpinOff: string;
    doorsClose: string;
    doorsOpen: string;
    lightsOn: string;
    lightsOff: string;
  };
  metrics: {
    accel0100: string;
    effectiveWltp: string;
    peakPower: string;
    charge800v: string;
    charge1080In: (min: number) => string;
  };
  tabs: {
    trims: string;
    color: string;
    wheels: string;
    interior: string;
    packages: string;
    simulator: string;
    finance: string;
    specs: string;
  };
  trimsPanel: {
    title: string;
    subtitle: string;
    included: string;
    torque: string;
    range: string;
  };
  colorPanel: {
    title: string;
    subtitle: string;
    includedBadge: string;
    metallicCoat: string;
  };
  wheelsPanel: {
    title: string;
    subtitle: string;
    neutralImpact: string;
    rangePenalty: (km: number) => string;
  };
  interiorPanel: {
    title: string;
    subtitle: string;
    upholsteryTitle: string;
    inlaysTitle: string;
    ambientTitle: string;
  };
  packagesPanel: {
    title: string;
    subtitle: string;
  };
  simulatorPanel: {
    title: string;
    subtitle: string;
    projectedRange: string;
    efficiency: string;
    peakCharge: string;
    ambientTemp: string;
    drivingProfile: string;
    cityProfile: string;
    mixedProfile: string;
    highwayProfile: string;
    hvacLabel: string;
    hvacActive: string;
    hvacEco: string;
  };
  financePanel: {
    title: string;
    subtitle: string;
    balloonLoan: string;
    operationalLease: string;
    cashPurchase: string;
    financingTerm: string;
    downPayment: string;
    estMonthlyPayment: string;
    aprRate: string;
    totalOutlay: string;
    fiveYearTco: string;
    cashPrice: string;
    maintenanceSavings: string;
  };
  specsPanel: {
    title: string;
    subtitle: string;
    dimensionsTab: string;
    powertrainTab: string;
    warrantyTab: string;
    dimLength: string;
    dimWheelbase: string;
    dimCurbWeight: string;
    dimDragCoeff: string;
    specGrossNet: string;
    specVoltageArch: string;
    specMotors: string;
    specVehicleWarranty: string;
    specBatteryWarranty: string;
  };
  dock: {
    vehicleTotal: string;
    estLease: string;
    perMonth: string;
    wltpRange: string;
    orderCta: string;
  };
  modal: {
    modalTitle: string;
    close: string;
    deliveryEstimate: string;
    selectedOptions: string;
    noOptions: string;
    depositDue: string;
    confirmReservation: string;
    reservationConfirmed: string;
    confirmationNotice: string;
    done: string;
  };
}
