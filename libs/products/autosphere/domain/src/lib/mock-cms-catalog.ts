import type {
  EditorialArticle,
  PressReview,
  PromotionalCampaign,
  VehicleModel,
} from './model';

export const AUTOSPHERE_MODELS: VehicleModel[] = [
  {
    id: 'autosphere-gt-v',
    slug: 'gt-v',
    name: 'AutoSphere GT-V',
    series: 'GranTurismo Electric',
    tagline: '800-Volt Aerodynamic Gran Coupé with Sub-3s Acceleration',
    heroBadge: '800V Ultra-Fast Architecture · 0.208 Cd',
    basePrice: 84900,
    currency: '€',
    deliveryEstimateWeeks: 6,
    seoDescription:
      'The AutoSphere GT-V is an all-electric gran coupé featuring dual & tri-motor powertrains, 800V ultra-fast charging, and 0.208 drag coefficient.',
    trims: [
      {
        id: 'pure-rwd',
        name: 'Pure RWD',
        badge: 'Long Range RWD',
        priceDelta: 0,
        powertrain: 'Single Motor RWD',
        powerKw: 280,
        horsepower: 380,
        torqueNm: 490,
        acceleration0to100: 5.2,
        topSpeedKmh: 225,
        wltpRangeKm: 610,
        batteryCapacityKwh: 92,
        chargingRateKw: 270,
        highlights: [
          'Rear-wheel drive balance with mechanical limited-slip differential',
          'Standard 14-speaker Meridian sound system',
          'Heat pump and pre-conditioning thermal management',
        ],
      },
      {
        id: 'performance-awd',
        name: 'Performance AWD',
        badge: 'Dual-Motor AWD · Popular',
        priceDelta: 14200,
        powertrain: 'Dual-Motor AWD',
        powerKw: 420,
        horsepower: 571,
        torqueNm: 750,
        acceleration0to100: 3.5,
        topSpeedKmh: 260,
        wltpRangeKm: 560,
        batteryCapacityKwh: 98,
        chargingRateKw: 320,
        highlights: [
          'Permanent-magnet synchronous motors front & rear with torque vectoring',
          'Adaptive dual-chamber air suspension with active damper damping',
          'Surround Matrix LED headlights with high-beam masking',
        ],
      },
      {
        id: 'apex-track',
        name: 'Apex Track Edition',
        badge: 'Tri-Motor Performance Flagship',
        priceDelta: 38500,
        powertrain: 'Tri-Motor Performance',
        powerKw: 680,
        horsepower: 925,
        torqueNm: 1150,
        acceleration0to100: 2.1,
        topSpeedKmh: 310,
        wltpRangeKm: 505,
        batteryCapacityKwh: 105,
        chargingRateKw: 350,
        highlights: [
          'Tri-motor torque vectoring with dual rear inverter drive',
          'Carbon-ceramic brakes (420 mm front discs, 10-piston calipers)',
          'Carbon aero kit: active diffuser flap and motorized rear wing',
        ],
      },
    ],
    colorways: [
      {
        id: 'nardo',
        name: 'Nardo Graphite',
        hex: '#52525b',
        finish: 'gloss',
        priceDelta: 0,
        priceLabel: 'Included',
        description: 'Deep non-metallic grey finish with gloss clear coat.',
      },
      {
        id: 'monaco',
        name: 'Monaco Blue',
        hex: '#1d4ed8',
        accentHex: '#1e3a8a',
        finish: 'metallic',
        priceDelta: 1250,
        priceLabel: '+€1,250',
        description:
          'Multi-layer metallic flake reflecting intense deep cyan highlights in daylight.',
      },
      {
        id: 'sunset',
        name: 'Sunset Rosso',
        hex: '#b91c1c',
        accentHex: '#991b1b',
        finish: 'metallic',
        priceDelta: 1250,
        priceLabel: '+€1,250',
        description:
          'Vibrant sports car metallic red formulated with deep aluminum mica.',
      },
      {
        id: 'titanium',
        name: 'Frozen Titanium',
        hex: '#475569',
        finish: 'matte',
        priceDelta: 2600,
        priceLabel: '+€2,600',
        description:
          'Satin matte sheen with scratch-resistant hydrophobic ceramic clear coat.',
      },
      {
        id: 'arctic',
        name: 'Arctic Pearl',
        hex: '#f8fafc',
        accentHex: '#e2e8f0',
        finish: 'pearl',
        priceDelta: 3100,
        priceLabel: '+€3,100',
        description:
          'Triple-coat iridescent white with subtle violet and gold pearl undertones.',
      },
    ],
    wheels: [
      {
        id: 'wheel-20',
        name: '20" AeroTurbine Flow-Formed',
        sizeInches: 20,
        style: 'Aero Efficiency',
        priceDelta: 0,
        priceLabel: 'Included',
        rangeImpactKm: 0,
      },
      {
        id: 'wheel-21',
        name: '21" V-Spoke Forged Sport',
        sizeInches: 21,
        style: 'Sport Forged',
        priceDelta: 2100,
        priceLabel: '+€2,100',
        rangeImpactKm: -12,
      },
      {
        id: 'wheel-22',
        name: '22" Apex Centerlock Carbon-Fiber',
        sizeInches: 22,
        style: 'Track Centerlock',
        priceDelta: 4800,
        priceLabel: '+€4,800',
        rangeImpactKm: -22,
      },
    ],
    packages: [
      {
        id: 'pilot-pack',
        name: 'Highway Autopilot & LiDAR Suite',
        category: 'Driver Assist',
        priceDelta: 3900,
        description:
          'Level 3 autonomous highway navigation and remote automated valet parking.',
        includedFeatures: [
          'Solid-state roof-integrated LiDAR with 300m range',
          'Automated lane change, off-ramp overtaking, and stop-and-go speed matching',
          '360° surround camera stream with HD bird-eye parking overlay',
        ],
      },
      {
        id: 'track-pack',
        name: 'Dynamic Track & Telemetry Package',
        category: 'Track Performance',
        priceDelta: 5400,
        description:
          'Chassis stiffening, telemetry recording, and drift mode configuration.',
        includedFeatures: [
          'Real-time GPS track lap timer with sector delta telemetry',
          'G-force and tire thermal monitoring HUD',
          'Variable front-to-rear torque distribution lock slider (0:100 to 50:50)',
        ],
      },
      {
        id: 'executive-pack',
        name: 'Executive Lounge & Glass Ceiling',
        category: 'Comfort & Luxury',
        priceDelta: 3200,
        description:
          'Ventilated massaging seats and electrochromic panoramic smart glass.',
        includedFeatures: [
          '9-mode massage with active pneumatic seat bolsters',
          'Electrochromic panoramic glass roof with 10-level tint control',
          'Cabin HEPA air purification with PM2.5 ionization sensor',
        ],
      },
    ],
    interiorUpholsteries: [
      {
        id: 'upholstery-nappa-black',
        name: 'Obsidian Nappa Leather',
        material: 'Nappa Leather',
        hex: '#18181b',
        priceDelta: 0,
        description:
          'Perforated full-grain Bavarian Nappa leather with micro-piping and heat ventilation.',
      },
      {
        id: 'upholstery-alcantara-graphite',
        name: 'Graphite Alcantara & Carmine Stitch',
        material: 'Alcantara Sport',
        hex: '#3f3f46',
        priceDelta: 1600,
        description:
          'Ultra-durable lightweight synthetic suede with contrast crimson stitching for optimal grip.',
      },
      {
        id: 'upholstery-nordic-white',
        name: 'Nordic Glacier Eco-Weave',
        material: 'Nordic Eco-Weave',
        hex: '#f4f4f5',
        priceDelta: 1200,
        description:
          'Breathable Scandinavian recycled wool-blend textile with hydrophobic nano-barrier.',
      },
      {
        id: 'upholstery-tuscan-cognac',
        name: 'Tuscan Cognac Saddle Leather',
        material: 'Nappa Leather',
        hex: '#9a3412',
        priceDelta: 2200,
        description:
          'Hand-burnished semi-aniline heritage saddle leather with bespoke diamond quilting.',
      },
    ],
    interiorTrims: [
      {
        id: 'trim-carbon',
        name: 'Matte 3K Twill Carbon Fiber',
        material: 'Carbon Fiber',
        hex: '#27272a',
        priceDelta: 1400,
      },
      {
        id: 'trim-smoked-oak',
        name: 'Open-Pore Smoked European Oak',
        material: 'Smoked Oak',
        hex: '#451a03',
        priceDelta: 850,
      },
      {
        id: 'trim-brushed-titanium',
        name: 'Satin Brushed Aerospace Titanium',
        material: 'Brushed Titanium',
        hex: '#71717a',
        priceDelta: 0,
      },
    ],
    ambientLightingOptions: [
      { id: 'ambient-cyan', name: 'Cyber Cyan 490nm', hex: '#06b6d4' },
      { id: 'ambient-crimson', name: 'Apex Crimson Red', hex: '#f43f5e' },
      { id: 'ambient-amber', name: 'Warm Sunset Amber', hex: '#f59e0b' },
      { id: 'ambient-aurora', name: 'Nordic Aurora Emerald', hex: '#10b981' },
      { id: 'ambient-violet', name: 'Ultra Violet Neon', hex: '#8b5cf6' },
    ],
    technicalSpecs: [
      {
        title: 'Performance & Drive',
        specs: [
          {
            label: 'Transmission',
            value: 'Single-speed direct drive front & rear',
          },
          { label: '0–100 km/h', value: '3.5 s (Performance AWD)' },
          { label: 'Top Speed', value: '260 km/h' },
          { label: 'Drag Coefficient', value: '0.208', unit: 'Cd' },
        ],
      },
      {
        title: 'Battery & High-Voltage Charging',
        specs: [
          { label: 'Architecture', value: '800 V ultra-fast' },
          { label: 'Usable Battery Capacity', value: '98', unit: 'kWh' },
          { label: 'DC Fast Charge (10% to 80%)', value: '18 min at 320 kW' },
          {
            label: 'AC On-Board Charger',
            value: '22',
            unit: 'kW (Three-phase)',
          },
        ],
      },
      {
        title: 'Dimensions & Capacities',
        specs: [
          {
            label: 'Length × Width × Height',
            value: '4,975 × 1,964 × 1,385',
            unit: 'mm',
          },
          { label: 'Wheelbase', value: '2,950', unit: 'mm' },
          { label: 'Curb Weight', value: '2,180', unit: 'kg' },
          {
            label: 'Luggage Compartment (Rear / Frunk)',
            value: '490 L + 85 L',
          },
        ],
      },
    ],
    editorialSummary: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'heading-2',
          content: [
            {
              nodeType: 'text',
              value: 'Sculpted by Aerodynamics. Powered by 800 Volts.',
            },
          ],
        },
        {
          nodeType: 'paragraph',
          content: [
            {
              nodeType: 'text',
              value:
                'The AutoSphere GT-V stands at the intersection of European GT proportions and zero-emission hyper-efficiency. Engineered on an 800-volt silicon-carbide platform, it replenishes 300 km of range in just 10 minutes at high-power European charging hubs.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'autosphere-aerosport-suv',
    slug: 'aerosport',
    name: 'AutoSphere AeroSport',
    series: 'Performance Crossover SUV',
    tagline:
      'Dual-Motor Electric SUV with 600km WLTP Range & Active Off-Road Air Lift',
    heroBadge: 'Active Off-Road Lift · 2,400kg Towing Capacity',
    basePrice: 92500,
    currency: '€',
    deliveryEstimateWeeks: 8,
    seoDescription:
      'The AutoSphere AeroSport is a luxury all-electric SUV with adjustable ride height, dual-motor AWD, and generous cargo capacity.',
    trims: [
      {
        id: 'expedition-awd',
        name: 'Expedition AWD',
        badge: 'All-Terrain Adventure',
        priceDelta: 0,
        powertrain: 'Dual-Motor AWD',
        powerKw: 360,
        horsepower: 490,
        torqueNm: 710,
        acceleration0to100: 4.6,
        topSpeedKmh: 220,
        wltpRangeKm: 590,
        batteryCapacityKwh: 102,
        chargingRateKw: 280,
        highlights: [
          'Variable ground clearance: 175 mm (aero mode) to 255 mm (rock crawl)',
          'Roof rails with 100 kg dynamic load capacity',
          'Heavy-duty underbody composite skid plates',
        ],
      },
      {
        id: 'vitesse-awd',
        name: 'Vitesse Sport AWD',
        badge: 'High-Power Luxury SUV',
        priceDelta: 16800,
        powertrain: 'Dual-Motor AWD',
        powerKw: 510,
        horsepower: 693,
        torqueNm: 920,
        acceleration0to100: 3.4,
        topSpeedKmh: 250,
        wltpRangeKm: 540,
        batteryCapacityKwh: 108,
        chargingRateKw: 320,
        highlights: [
          'Active rear-wheel steering (up to 4.5° counter-steer for agile city parking)',
          'Sport air suspension with active roll stabilization (48V e-bars)',
          'Panoramic glass sunroof and acoustic insulated double-glazed windows',
        ],
      },
    ],
    colorways: [
      {
        id: 'nardo',
        name: 'Nardo Graphite',
        hex: '#52525b',
        finish: 'gloss',
        priceDelta: 0,
        priceLabel: 'Included',
        description: 'Stealth gloss graphite grey.',
      },
      {
        id: 'monaco',
        name: 'Monaco Blue',
        hex: '#1d4ed8',
        accentHex: '#1e3a8a',
        finish: 'metallic',
        priceDelta: 1250,
        priceLabel: '+€1,250',
        description: 'Vibrant oceanic blue metallic.',
      },
      {
        id: 'titanium',
        name: 'Frozen Titanium',
        hex: '#475569',
        finish: 'matte',
        priceDelta: 2600,
        priceLabel: '+€2,600',
        description: 'Protective satin matte titanium.',
      },
    ],
    wheels: [
      {
        id: 'wheel-20',
        name: '20" Off-Road Rugged Alloy',
        sizeInches: 20,
        style: 'Aero Efficiency',
        priceDelta: 0,
        priceLabel: 'Included',
        rangeImpactKm: 0,
      },
      {
        id: 'wheel-22',
        name: '22" Diamond-Cut AeroSport Forged',
        sizeInches: 22,
        style: 'Sport Forged',
        priceDelta: 2800,
        priceLabel: '+€2,800',
        rangeImpactKm: -18,
      },
    ],
    packages: [
      {
        id: 'towing-pack',
        name: 'Heavy-Duty Tow & Cargo Package',
        category: 'Comfort & Luxury',
        priceDelta: 2200,
        description:
          'Electric deployable tow bar and trailer stability control.',
        includedFeatures: [
          'Electrically folding trailer hitch with 2,400 kg braked towing capacity',
          'Trailer reversing assist with dynamic steering visualization',
          '12V / 230V high-output cargo socket (3.6 kW vehicle-to-load output)',
        ],
      },
    ],
    interiorUpholsteries: [
      {
        id: 'upholstery-rugged-charcoal',
        name: 'Ballistic Technical Fabric & Leather',
        material: 'Vegan Ultra-Suede',
        hex: '#27272a',
        priceDelta: 0,
        description:
          'Heavy-duty water-repellent performance cabin textile designed for rugged outdoor use.',
      },
      {
        id: 'upholstery-mojave-tan',
        name: 'Mojave Desert Warm Saddle',
        material: 'Nappa Leather',
        hex: '#78350f',
        priceDelta: 1800,
        description:
          'Treated dirt-resistant full leather with high-wear double stitching.',
      },
    ],
    interiorTrims: [
      {
        id: 'trim-anodized-aluminum',
        name: 'Machined Matte Anodized Aluminum',
        material: 'Matte Aluminum',
        hex: '#71717a',
        priceDelta: 0,
      },
      {
        id: 'trim-smoked-oak',
        name: 'Dark Open-Pore Smoked Oak',
        material: 'Smoked Oak',
        hex: '#451a03',
        priceDelta: 750,
      },
    ],
    ambientLightingOptions: [
      { id: 'ambient-amber', name: 'Warm Sunset Amber', hex: '#f59e0b' },
      { id: 'ambient-cyan', name: 'Glacier Blue', hex: '#06b6d4' },
      { id: 'ambient-aurora', name: 'Alpine Forest Green', hex: '#10b981' },
    ],
    technicalSpecs: [
      {
        title: 'Performance & Capability',
        specs: [
          { label: 'Ground Clearance', value: '175 – 255 mm (Air Lift)' },
          { label: 'Towing Capacity', value: '2,400 kg' },
          { label: 'Wading Depth', value: '500 mm' },
        ],
      },
    ],
    editorialSummary: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'heading-2',
          content: [
            { nodeType: 'text', value: 'Go Anywhere with Zero Compromise' },
          ],
        },
      ],
    },
  },
];

export const CONTENTFUL_CAMPAIGNS: PromotionalCampaign[] = [
  {
    sys: {
      id: 'camp-launch-2026-eu',
      type: 'Entry',
      createdAt: '2026-03-01T08:00:00Z',
      updatedAt: '2026-04-15T14:30:00Z',
      revision: 4,
      locale: 'en-US',
      environment: 'master',
    },
    campaignId: 'AUT-2026-EU-LAUNCH',
    badge: 'Limited Allocation Advantage',
    title: '2026 European Launch Advantage',
    description:
      'Order an AutoSphere GT-V or AeroSport today and receive our complete home and highway charging package at no additional cost.',
    highlightOffer:
      'Complimentary 11kW Bi-Directional Home Wallbox + 1 Year European Fast-Charging Pass Included (€2,400 Editorial Incentive)',
    validUntil: 'November 30, 2026',
    disclaimer:
      'Applies to orders placed before November 30, 2026. Fast charging pass redeemable at all Ionity, Fastned, and Porsche Turbo Charger stations across 28 European countries.',
    active: true,
  },
];

export const CONTENTFUL_EDITORIAL_ARTICLES: EditorialArticle[] = [
  {
    sys: {
      id: 'art-800v-sic-charge',
      type: 'Entry',
      createdAt: '2026-02-14T09:00:00Z',
      updatedAt: '2026-04-10T16:20:00Z',
      revision: 7,
      locale: 'en-US',
      environment: 'master',
    },
    title:
      '800V Silicon-Carbide Architecture: The 19-Minute Fast Charging Revolution',
    slug: '800v-silicon-carbide-architecture',
    category: 'Engineering',
    readTimeMinutes: 4,
    author: {
      name: 'Dr. Marcus Vonberg',
      role: 'Head of High-Voltage Powertrain Systems',
    },
    leadParagraph:
      'By transitioning from 400V copper-heavy windings to 800V silicon-carbide (SiC) semiconductor inverters, our engineers doubled charging throughput while shaving 38kg off the vehicle harness.',
    tags: ['800V Architecture', 'Silicon Carbide', 'DC Fast Charging', 'WLTP'],
    body: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'heading-2',
          content: [
            {
              nodeType: 'text',
              value: 'Thermal Equilibrium at 320 kW Peak Throughput',
            },
          ],
        },
        {
          nodeType: 'paragraph',
          content: [
            {
              nodeType: 'text',
              value:
                'Most electric vehicles hit peak charging speed for mere seconds before thermal throttling forces power down. The AutoSphere thermal loop utilizes chilled dielectric fluid circulated through nickel-plated micro-channels embedded directly into the prismatic cell matrix.',
            },
          ],
        },
        {
          nodeType: 'heading-3',
          content: [{ nodeType: 'text', value: 'Key Engineering Metrics' }],
        },
        {
          nodeType: 'unordered-list',
          content: [
            {
              nodeType: 'list-item',
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        '10% to 80% State of Charge in 19 minutes flat at 350kW DC pedestals.',
                    },
                  ],
                },
              ],
            },
            {
              nodeType: 'list-item',
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Flat charging plateau maintained up to 68% SOC with zero thermal throttling.',
                    },
                  ],
                },
              ],
            },
            {
              nodeType: 'list-item',
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Silicon-carbide MOSFET switching efficiency rated at 99.2% under full load.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    sys: {
      id: 'art-eco-weave-circularity',
      type: 'Entry',
      createdAt: '2026-03-02T11:30:00Z',
      updatedAt: '2026-04-18T10:15:00Z',
      revision: 5,
      locale: 'en-US',
      environment: 'master',
    },
    title:
      'Nordic Glacier Eco-Weave: Circular Luxury from Upcycled Maritime Plastics',
    slug: 'nordic-glacier-eco-weave-circular-luxury',
    category: 'Sustainability',
    readTimeMinutes: 3,
    author: {
      name: 'Elena Lindqvist',
      role: 'Chief Color & Material Designer',
    },
    leadParagraph:
      'True luxury no longer requires bovine slaughter or petrochemical leatherettes. Nordic Glacier Eco-Weave combines regenerated sea nylon with organic Scandinavian wool for unmatched haptic depth.',
    tags: [
      'Econyl',
      'Circular Economy',
      'Sustainable Cabin',
      'Zero Deforestation',
    ],
    body: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'heading-2',
          content: [
            {
              nodeType: 'text',
              value: 'Crafting Tactile Warmth from the Ocean',
            },
          ],
        },
        {
          nodeType: 'paragraph',
          content: [
            {
              nodeType: 'text',
              value:
                'Every vehicle cabin upholstered in Nordic Glacier Eco-Weave diverts 14.8 kg of discarded fishing nets from the North Sea. The yarn is spun in Piedmont, Italy, and coated with a hydrophobic plant-based nano-barrier that repels espresso, wine, and denim dye transfer.',
            },
          ],
        },
        {
          nodeType: 'paragraph',
          content: [
            {
              nodeType: 'text',
              value:
                'The result is a breathable, temperature-neutral textile that remains cool in Mediterranean summers and warm during alpine winters, outlasting conventional automotive leather by 40,000 abrasion cycles.',
            },
          ],
        },
      ],
    },
  },
  {
    sys: {
      id: 'art-nurburgring-aero-021',
      type: 'Entry',
      createdAt: '2026-03-20T14:45:00Z',
      updatedAt: '2026-04-20T09:00:00Z',
      revision: 9,
      locale: 'en-US',
      environment: 'master',
    },
    title:
      'Track-Tested Aerodynamics: From Nürburgring Simulation to 0.208 Drag Coefficient',
    slug: 'track-tested-aerodynamics-0208-cd',
    category: 'Performance',
    readTimeMinutes: 5,
    author: {
      name: 'Klaus Becker',
      role: 'Head of Aerodynamic Fluid Dynamics',
    },
    leadParagraph:
      'Reaching 610km of high-speed autobahn range requires obsessive drag management. Active cooling flaps, aeroblade wheels, and a flat underbody venturi tunnel deliver class-leading 0.208 Cd.',
    tags: [
      'Aerodynamics',
      'Nürburgring Nordschleife',
      'Downforce Vectoring',
      '0.208 Cd',
    ],
    body: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'heading-2',
          content: [
            {
              nodeType: 'text',
              value: 'Active Aero Vanes & Underbody Venturis',
            },
          ],
        },
        {
          nodeType: 'paragraph',
          content: [
            {
              nodeType: 'text',
              value:
                'At speeds above 120 km/h, the front cooling shutters close hermetically while the rear diffuser extends by 65mm. This reduces turbulent wake behind the vehicle, adding +42 km of effective highway range without carrying an extra kilogram of battery ballast.',
            },
          ],
        },
        {
          nodeType: 'paragraph',
          content: [
            {
              nodeType: 'text',
              value:
                'In Sport and Apex track modes, the active rear airbrake can deploy up to 45 degrees under heavy braking, generating 180 kg of rear axle downforce into Turn 1 at the Nürburgring.',
            },
          ],
        },
      ],
    },
  },
];

export const CONTENTFUL_PRESS_REVIEWS: PressReview[] = [
  {
    sys: {
      id: 'press-top-gear',
      type: 'Entry',
      createdAt: '2026-03-15T12:00:00Z',
      updatedAt: '2026-03-15T12:00:00Z',
      revision: 1,
      locale: 'en-US',
      environment: 'master',
    },
    publication: 'Top Gear Magazine',
    rating: 5,
    quote:
      'The AutoSphere GT-V redefines what high-voltage electric grand touring feels like. Rapid, tactile, and endlessly composed across Alpine passes.',
    author: 'Ollie Kew',
    date: 'March 2026',
  },
  {
    sys: {
      id: 'press-auto-motor-sport',
      type: 'Entry',
      createdAt: '2026-03-18T10:00:00Z',
      updatedAt: '2026-03-18T10:00:00Z',
      revision: 1,
      locale: 'de-DE',
      environment: 'master',
    },
    publication: 'Auto Motor und Sport',
    rating: 5,
    quote:
      'Deutsche Ingenieurskunst auf höchstem Niveau: Die 800V-Ladekurve hält, was sie verspricht. 10 bis 80 Prozent in unter 20 Minuten ist die neue Realität.',
    author: 'Jochen Knecht',
    date: 'März 2026',
  },
  {
    sys: {
      id: 'press-car-and-driver',
      type: 'Entry',
      createdAt: '2026-03-24T15:00:00Z',
      updatedAt: '2026-03-24T15:00:00Z',
      revision: 1,
      locale: 'en-US',
      environment: 'master',
    },
    publication: 'Car and Driver',
    rating: 5,
    quote:
      'Sub-50ms chassis vectoring, an actual mechanical limited-slip differential, and interior ergonomics that put legacy Stuttgart and Munich marques on notice.',
    author: 'Ezra Dyer',
    date: 'April 2026',
  },
];
