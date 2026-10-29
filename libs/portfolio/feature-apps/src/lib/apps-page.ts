import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton, Badge, SectionHeading, Tag } from '@ah/ui';

interface AppItem {
  id: string;
  title: string;
  category: 'production' | 'lab';
  badge: {
    label: string;
    variant: 'success' | 'accent' | 'info' | 'warning' | 'neutral';
    pulse?: boolean;
  };
  eyebrow: string;
  summary: string;
  route: string;
  stack: string[];
  features: string[];
  architectureNotes: string;
  credentialsNote?: string;
  icon: string;
}

@Component({
  selector: 'ah-apps-page',
  imports: [AhButton, Badge, RouterLink, SectionHeading, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './apps-page.html',
  styleUrl: './apps-page.scss',
})
export class AppsPage {
  protected readonly productionApps: AppItem[] = [
    {
      id: 'dispatch',
      title: 'PulseOps · Commercial Operations & Dispatch Control Center',
      category: 'production',
      badge: { label: '🟢 Production Live', variant: 'success', pulse: true },
      eyebrow: 'Commercial Logistics & Subcontractor Hub · London Zones 1–4',
      summary:
        'A comprehensive remote coordinator command center for commercial laundry and hospitality logistics. Manages daily intake, route planning, driver transport, subcontractor wash manifests, missing item chases, and automated shift handovers.',
      route: '/apps/dispatch',
      icon: '🧺',
      stack: [
        'Zoneless Angular 22',
        'Native Federation',
        'NestJS REST API',
        'MongoDB Atlas M0',
        'AES-256-GCM',
        'PBKDF2 Auth',
        'NgRx SignalStore',
      ],
      features: [
        '6-Stage Real-Time Order Kanban (Intake, Wash, Ready, Dispatched, Delivered, Invoiced)',
        'Live Fleet Driver Dispatch with stop sequence ordering and emergency courier booking',
        'Subcontractor Plant Management with capacity tracking, wash claims, and QA defect flags',
        'Simulated WhatsApp Comms Hub (Customer, Driver, and Production channels with FIFO ring buffers)',
        'Digital Proof of Delivery (POD) with signature capture and Loading Bay Gate Code security',
        'Shift Handover Automated Reporting with completed orders, incidents, and pending chases',
      ],
      architectureNotes:
        'Enforces strict database overload protection for MongoDB Atlas Free Tier (max 50 active orders, 10 drivers, 8 plants, 64KB document ceiling). Fields like phone numbers, gate instructions, and signatures are encrypted with AES-256-GCM at rest.',
      credentialsNote:
        'Demo personas pre-seeded: 1-click switcher in the top toolbar to test as Owner, Coordinator, Driver, Subcontractor Plant Manager, or Hotel Customer (default password: london123).',
    },
    {
      id: 'strategy',
      title: 'StrategyApp · Financial Planning & Wealth Projection Engine',
      category: 'production',
      badge: { label: '⚡ Interactive Platform', variant: 'accent' },
      eyebrow: 'Fintech · Scenario Modeling & Cashflow Ledgers',
      summary:
        'Multi-scenario financial forecasting platform that projects net worth, runway, savings rates, and emergency fund coverage over multi-year horizons without transmitting sensitive financial data to any external server.',
      route: '/apps/strategy',
      icon: '📈',
      stack: [
        'Angular 22',
        'NgRx SignalStore',
        'Chart.js',
        'IndexedDB Local Storage',
        'PDF Export Engine',
        '@ah/ui Design Tokens',
      ],
      features: [
        'Multi-Scenario Financial Simulations (Base, Aggressive Savings, Conservative, Career Transition)',
        'Interactive Double-Entry Ledger with categorical income and expense budget tracking',
        'Real-time Net Worth Projections and interactive SVG/Chart visualizers',
        'Emergency Fund Runway & Milestone Target progress calculation',
        'Automated Executive Financial PDF report export',
      ],
      architectureNotes:
        'Zero external data transmission: 100% client-side privacy-first computation with IndexedDB local persistence and deterministic financial modeling.',
      credentialsNote:
        'Pre-loaded with sample financial portfolios across multiple currencies (GBP, EUR, TND). Fully interactive scenario switcher in the sidebar.',
    },
    {
      id: 'studylm',
      title: 'StudyLM · Grounded AI Multi-Tier Learning & Drill Arena',
      category: 'production',
      badge: { label: '🤖 AI Grounded Engine', variant: 'accent', pulse: true },
      eyebrow: 'NotebookLM-Style Synthesis · n8n Autonomous Workflow Integration',
      summary:
        'A comprehensive NotebookLM-style study and exam mastery application powered by self-hosted n8n workflows and Google Gemini. Ingests research slides, documentation links, and source texts, synthesizing executive study briefs, 3D flip flashcard decks, interactive quiz arenas, and multi-speaker audio overviews organized across 3 strictly categorized competency tiers: Beginner 🌱, Intermediate ⚡, and Expert 🔥.',
      route: '/apps/studylm',
      icon: '📚',
      stack: [
        'Zoneless Angular 22',
        'Native Federation',
        'n8n AI Workflow Engine',
        'Google Gemini 2.0 Flash',
        'NgRx SignalStore',
        'Angular Signal Forms',
        'Web Speech API',
      ],
      features: [
        'NotebookLM Multi-Source Ingestion: Process slide decks, markdown papers, web documentation URLs, and personal notes',
        'Strict 3-Tier Categorization: Beginner (mental models), Intermediate (production idioms), and Expert (internals & edge cases)',
        'Interactive 3D Flip Flashcards with Leitner spaced-repetition ratings (Again, Hard, Good, Easy) and keyboard shortcuts',
        'Interactive Quiz Arena with instant scenario feedback, distractor refutations, and source citations',
        'NotebookLM Audio Overview simulation: Two AI hosts (Dr. Sarah & Alex) deep-diving the material with Web Speech Synthesis',
        'Dual Gateway Architecture: Connects directly to self-hosted n8n instance via local/cloud webhooks with 100% offline client fallback',
        'Multi-Format Exports: 1-click export to Anki TSV/CSV deck and Markdown executive study guide',
      ],
      architectureNotes:
        'Built with 100% zoneless change detection and Angular Signal Forms. Integrates with self-hosted n8n via POST /webhook/study-synthesizer, using Google Gemini API credentials and resilient client-side grounded extraction failovers.',
      credentialsNote:
        'Connected to live n8n server with pre-seeded high-yield decks (Angular 19 Zoneless, Distributed Consensus & Raft). Click ⚙️ to configure custom webhook endpoints or test live ping latency.',
    },
  ];

  protected readonly engineeringLabs: AppItem[] = [
    {
      id: 'sky',
      title: 'Sky Lab · Real-Time Celestial Planetarium & Night Planner',
      category: 'lab',
      badge: { label: '🌌 3D WebGL Engine', variant: 'info' },
      eyebrow: 'Astronomy & 3D Graphics · WebGL & Orekit Spring Boot',
      summary:
        'Pick any location on Earth, dive down from orbit to ground level, and explore the night sky in real time: 5,000 accurate stars, constellations, exact Moon phases, visible planets, the Milky Way, and meteor showers.',
      route: '/labs/sky',
      icon: '✨',
      stack: [
        'Three.js WebGL',
        'Custom GLSL Shaders',
        'Astronomy Engine',
        'Spring Boot 4 + Orekit',
        'Render Hosted Orbit API',
      ],
      features: [
        'Interactive 3D Earth Globe with smooth orbital dive down to ground observer perspective',
        'Real-Time Starfield of 5,000 real stars with constellation figure projections',
        'True Moon Phase & Planet ephemerides calculations for any historical or future date',
        'Astronomical Twilight, darkness windows, and observation condition planner',
      ],
      architectureNotes:
        'Framework-free Three.js engine with on-demand frame rendering, off-screen pausing, and automated tier scaling for 60fps performance across mobile and desktop.',
    },
    {
      id: 'rxjs',
      title: 'RxJS Interactive Lab · Stream Operators & Reactive Architecture',
      category: 'lab',
      badge: { label: '🧪 Reactive Lab', variant: 'warning' },
      eyebrow: 'Reactive Programming · Marble Visualizers & Backpressure',
      summary:
        'An interactive laboratory for mastering complex RxJS stream mechanics: animated marble diagrams, operator comparisons, backpressure strategies, multicast subjects, and signal interoperability.',
      route: '/labs/rxjs',
      icon: '⚡',
      stack: [
        'Angular 22 Zoneless',
        'RxJS 7+',
        'SVG Animated Pipelines',
        'Signal-to-Observable Interop',
      ],
      features: [
        'Live Marble Diagrams showing asynchronous value emission and error propagation',
        'Side-by-Side Backpressure Showdown: debounceTime vs throttleTime vs auditTime vs sampleTime',
        'Combination Operator Simulator: switchMap vs mergeMap vs concatMap vs exhaustMap',
        'Production Resilient Patterns: exponential backoff retry and request deduplication',
      ],
      architectureNotes:
        'Zoneless reactive pipeline visualizer connecting RxJS Observables directly to Angular Signals without zone.js overhead.',
    },
    {
      id: 'ngrx',
      title: 'NgRx State Architecture Lab · SignalStore & Redux Workbench',
      category: 'lab',
      badge: { label: '🏛️ Architecture Lab', variant: 'neutral' },
      eyebrow: 'State Architecture · NgRx Store & @ngrx/signals',
      summary:
        'Comprehensive workbench exploring enterprise state architectures: visual Redux unidirectional data flow, asynchronous side-effects, declarative SignalStore with entity normalization, and an architectural comparison matrix.',
      route: '/labs/ngrx',
      icon: '🧠',
      stack: [
        'Angular 22',
        '@ngrx/signals',
        '@ngrx/signals/entities',
        'NgRx Store & Effects',
        '@ah/ui Design System',
      ],
      features: [
        'Interactive 4-Stage Redux Cycle (Dispatch Action → Reducer Transition → Selector Query → Effect Execution)',
        'Declarative SignalStore with withEntities(), withComputed(), and rxMethod() async pipelines',
        'Time-Travel Debugging Panel with state snapshots, replay controls, and rollback capability',
        'Architectural Showdown: In-depth comparison matrix of NgRx Store vs SignalStore vs Service-based state',
      ],
      architectureNotes:
        'Demonstrates modern Angular state patterns with zero zone.js overhead, combining lightweight functional composition with robust enterprise invariants.',
    },
  ];

  constructor() {
    inject(Seo).update({
      title: 'Applications & Interactive Engineering Labs · Ahmed Hrichi',
      description:
        'Explore live production applications and interactive engineering laboratories: PulseOps commercial dispatch, StrategyApp financial planning, Sky Lab 3D planetarium, RxJS and NgRx architectures.',
      path: '/apps',
    });
  }
}
