/**
 * Core Headless CMS & Automotive Domain Types for AutoSphere.
 * Models follow Contentful CDA (Content Delivery API) schema standards.
 */

export interface ContentfulSys {
  id: string;
  type: 'Entry' | 'Asset';
  createdAt: string;
  updatedAt: string;
  revision: number;
  locale: string;
  environment: string;
}

export interface ContentfulAsset {
  sys: ContentfulSys;
  title: string;
  description?: string;
  url: string;
  contentType: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export interface ContentfulRichTextNode {
  nodeType:
    | 'paragraph'
    | 'heading-2'
    | 'heading-3'
    | 'unordered-list'
    | 'list-item'
    | 'text';
  value?: string;
  marks?: Array<{ type: 'bold' | 'italic' | 'code' }>;
  content?: ContentfulRichTextNode[];
}

export interface ContentfulRichTextDocument {
  nodeType: 'document';
  data: Record<string, unknown>;
  content: ContentfulRichTextNode[];
}

export interface EditorialArticle {
  sys: ContentfulSys;
  title: string;
  slug: string;
  category: 'Engineering' | 'Sustainability' | 'Performance' | 'Design';
  readTimeMinutes: number;
  author: {
    name: string;
    role: string;
  };
  leadParagraph: string;
  body: ContentfulRichTextDocument;
  tags: string[];
}

export interface PromotionalCampaign {
  sys: ContentfulSys;
  campaignId: string;
  badge: string;
  title: string;
  description: string;
  highlightOffer: string;
  validUntil: string;
  disclaimer: string;
  active: boolean;
}

export interface PressReview {
  sys: ContentfulSys;
  publication: string;
  rating: number;
  quote: string;
  author: string;
  date: string;
}

export interface VehicleTrim {
  id: string;
  name: string;
  badge: string;
  priceDelta: number;
  powertrain: 'Single Motor RWD' | 'Dual-Motor AWD' | 'Tri-Motor Performance';
  powerKw: number;
  horsepower: number;
  torqueNm: number;
  acceleration0to100: number; // in seconds
  topSpeedKmh: number;
  wltpRangeKm: number;
  batteryCapacityKwh: number;
  chargingRateKw: number;
  highlights: string[];
}

export interface VehicleColorway {
  id: string;
  name: string;
  hex: string;
  accentHex?: string;
  finish: 'gloss' | 'metallic' | 'matte' | 'pearl';
  priceDelta: number;
  priceLabel: string;
  description: string;
}

export interface VehicleWheel {
  id: string;
  name: string;
  sizeInches: number;
  style: 'Aero Efficiency' | 'Sport Forged' | 'Track Centerlock';
  priceDelta: number;
  priceLabel: string;
  rangeImpactKm: number; // e.g. -15 km for 22" vs base 20"
}

export interface VehiclePackage {
  id: string;
  name: string;
  category: 'Driver Assist' | 'Comfort & Luxury' | 'Track Performance';
  priceDelta: number;
  description: string;
  includedFeatures: string[];
}

export interface InteriorUpholstery {
  id: string;
  name: string;
  material:
    | 'Nappa Leather'
    | 'Alcantara Sport'
    | 'Nordic Eco-Weave'
    | 'Vegan Ultra-Suede';
  hex: string;
  priceDelta: number;
  description: string;
}

export interface InteriorTrim {
  id: string;
  name: string;
  material:
    'Carbon Fiber' | 'Smoked Oak' | 'Brushed Titanium' | 'Matte Aluminum';
  hex: string;
  priceDelta: number;
}

export interface AmbientLightingOption {
  id: string;
  name: string;
  hex: string;
}

export interface TechnicalSpecItem {
  label: string;
  value: string;
  unit?: string;
}

export interface TechnicalSpecCategory {
  title: string;
  specs: TechnicalSpecItem[];
}

export interface VehicleModel {
  id: string;
  slug: string;
  name: string;
  series: string;
  tagline: string;
  heroBadge: string;
  basePrice: number;
  currency: string;
  trims: VehicleTrim[];
  colorways: VehicleColorway[];
  wheels: VehicleWheel[];
  packages: VehiclePackage[];
  interiorUpholsteries: InteriorUpholstery[];
  interiorTrims: InteriorTrim[];
  ambientLightingOptions: AmbientLightingOption[];
  technicalSpecs: TechnicalSpecCategory[];
  editorialSummary: ContentfulRichTextDocument;
  seoDescription: string;
  deliveryEstimateWeeks: number;
}

export interface ConfiguratorState {
  selectedModelSlug: string;
  selectedTrimId: string;
  selectedColorId: string;
  selectedWheelId: string;
  selectedUpholsteryId?: string;
  selectedInteriorTrimId?: string;
  selectedAmbientLightId?: string;
  selectedPackageIds: string[];
  isPreviewMode: boolean; // Contentful Live Draft Preview
}

export interface FinanceSummary {
  cashPrice: number;
  downPayment: number;
  termMonths: 24 | 36 | 48 | 60;
  monthlyLease: number;
  monthlyLoan: number;
  annualInterestRate: number;
  residualValue: number;
  totalCostOfOwnership: number;
  estimatedDeliveryWeeks: number;
}

export interface RangeSimulation {
  simulatedRangeKm: number;
  wltpBaseRangeKm: number;
  consumptionKwhPer100Km: number;
  temperatureImpactPercent: number;
  speedImpactPercent: number;
  fastCharge10to80Min: number;
  rangeAdded10MinKm: number;
}
