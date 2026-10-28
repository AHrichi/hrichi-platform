import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { AhButton, SectionHeading, Tag } from '@ah/ui';

export type PatternKey =
  'service-signals' | 'service-rxjs' | 'signal-store' | 'global-store';

export interface ArchitectureComparison {
  key: PatternKey;
  name: string;
  tagline: string;
  badge: 'simplest' | 'stream-heavy' | 'recommended' | 'enterprise';
  bundleWeight: string;
  reactivityModel: string;
  learningCurve: 'Gentle' | 'Moderate' | 'Steep';
  timeTravelSupport:
    'None' | 'Manual' | 'Custom Plugin' | 'Full Redux DevTools';
  whenToUse: string[];
  whenToAvoid: string[];
  codeSample: string;
}

@Component({
  selector: 'ah-ngrx-vs-services',
  imports: [SectionHeading, AhButton, Tag],
  template: `
    <div class="architecture-guide-container">
      <ah-section-heading
        eyebrow="Architectural Showdown"
        heading="NgRx vs Services: State Strategy Matrix"
        lead="A recruiter-ready, senior-level evaluation: when to use plain Services (Signals/RxJS), when to pick NgRx SignalStore, and when to reach for the Global Redux Store."
      />

      <!-- State Architecture Spectrum Visual Ruler -->
      <div class="spectrum-card">
        <div class="spectrum-header">
          <span class="spectrum-title"
            >The Angular State Architecture Spectrum</span
          >
          <span class="spectrum-sub"
            >From Lightweight UI Reactivity to Mission-Critical Enterprise
            Orchestration</span
          >
        </div>
        <div class="spectrum-track">
          <div class="spectrum-step tier-1">
            <span class="step-num">Tier 1</span>
            <strong>Component Signal</strong>
            <span>Local UI flags, toggles, forms</span>
          </div>
          <div class="spectrum-arrow">→</div>
          <div class="spectrum-step tier-2">
            <span class="step-num">Tier 2</span>
            <strong>Signal Service</strong>
            <span>Feature-scoped, single API service</span>
          </div>
          <div class="spectrum-arrow">→</div>
          <div class="spectrum-step tier-3 highlight-tier">
            <span class="step-num">Tier 3 ⭐</span>
            <strong>NgRx SignalStore</strong>
            <span>Modular, normalized O(1), rxMethod</span>
          </div>
          <div class="spectrum-arrow">→</div>
          <div class="spectrum-step tier-4">
            <span class="step-num">Tier 4</span>
            <strong>Global Redux Store</strong>
            <span>Multi-team, cross-feature events</span>
          </div>
        </div>
      </div>

      <!-- Interactive State Advisor Wizard -->
      <div class="advisor-card">
        <div class="advisor-header">
          <div class="advisor-title-group">
            <span class="icon">🧭</span>
            <div>
              <h3 class="advisor-title">State Architecture Advisor</h3>
              <p class="advisor-sub">
                Answer 3 questions to generate an architectural recommendation
                for your project.
              </p>
            </div>
          </div>
          <ah-tag>Interactive Wizard</ah-tag>
        </div>

        <div class="wizard-questions">
          <!-- Question 1: Scope -->
          <div class="question-block">
            <span class="q-label">1. State Scope &amp; Sharing:</span>
            <div class="option-pills">
              <button
                type="button"
                class="pill"
                [class.active]="stateScope() === 'local'"
                (click)="stateScope.set('local')"
              >
                Feature / Component Local
              </button>
              <button
                type="button"
                class="pill"
                [class.active]="stateScope() === 'modular'"
                (click)="stateScope.set('modular')"
              >
                Shared Across Related Features
              </button>
              <button
                type="button"
                class="pill"
                [class.active]="stateScope() === 'global'"
                (click)="stateScope.set('global')"
              >
                App-Wide Global Cache
              </button>
            </div>
          </div>

          <!-- Question 2: Async Complexity -->
          <div class="question-block">
            <span class="q-label">2. Async &amp; Event Choreography:</span>
            <div class="option-pills">
              <button
                type="button"
                class="pill"
                [class.active]="asyncComplexity() === 'simple'"
                (click)="asyncComplexity.set('simple')"
              >
                Simple HTTP fetch / mutations
              </button>
              <button
                type="button"
                class="pill"
                [class.active]="asyncComplexity() === 'streams'"
                (click)="asyncComplexity.set('streams')"
              >
                Debounced search, polling, WebSockets
              </button>
              <button
                type="button"
                class="pill"
                [class.active]="asyncComplexity() === 'choreography'"
                (click)="asyncComplexity.set('choreography')"
              >
                Cross-feature action choreography
              </button>
            </div>
          </div>

          <!-- Question 3: Team & Audit -->
          <div class="question-block">
            <span class="q-label">3. Team Scale &amp; Time-Travel Audit:</span>
            <div class="option-pills">
              <button
                type="button"
                class="pill"
                [class.active]="auditLevel() === 'standard'"
                (click)="auditLevel.set('standard')"
              >
                Standard Dev (Console / Tests)
              </button>
              <button
                type="button"
                class="pill"
                [class.active]="auditLevel() === 'strict'"
                (click)="auditLevel.set('strict')"
              >
                Strict Compliance / Redux DevTools Replay
              </button>
            </div>
          </div>
        </div>

        <!-- Wizard Recommendation Output -->
        <div class="recommendation-result">
          <div class="result-badge-row">
            <span class="result-label">Recommended Architecture:</span>
            <ah-tag>{{ wizardRecommendation().winner }}</ah-tag>
          </div>
          <p class="result-rationale">{{ wizardRecommendation().rationale }}</p>
          <div class="result-actions">
            <button
              type="button"
              ahButton="secondary"
              size="sm"
              (click)="selectPattern(wizardRecommendation().patternKey)"
            >
              Inspect Pattern Specifications &amp; Code Snippet &darr;
            </button>
          </div>
        </div>
      </div>

      <!-- Pattern Selector Cards -->
      <div class="pattern-tabs">
        @for (pat of patterns; track pat.key) {
          <button
            type="button"
            class="pattern-tab-card"
            [class.active]="selectedPatternKey() === pat.key"
            (click)="selectPattern(pat.key)"
          >
            <div class="tab-top">
              <span class="tab-name">{{ pat.name }}</span>
              <ah-tag>
                {{ pat.badge }}
              </ah-tag>
            </div>
            <p class="tab-tagline">{{ pat.tagline }}</p>
          </button>
        }
      </div>

      <!-- Detailed Specification of Selected Pattern -->
      @if (currentPattern(); as pat) {
        <div class="pattern-detail-card">
          <div class="detail-header">
            <div>
              <span class="detail-eyebrow">Architecture Profile</span>
              <h3 class="detail-title">{{ pat.name }}</h3>
              <p class="detail-tagline">{{ pat.tagline }}</p>
            </div>
            <div class="metrics-cluster">
              <div class="metric-chip">
                <span class="k">Bundle Impact</span>
                <span class="v">{{ pat.bundleWeight }}</span>
              </div>
              <div class="metric-chip">
                <span class="k">Learning Curve</span>
                <span class="v">{{ pat.learningCurve }}</span>
              </div>
              <div class="metric-chip">
                <span class="k">Time-Travel</span>
                <span class="v">{{ pat.timeTravelSupport }}</span>
              </div>
            </div>
          </div>

          <div class="tradeoffs-grid">
            <div class="tradeoff-box pros">
              <span class="box-title">✅ When To Use (Prime Fit)</span>
              <ul>
                @for (item of pat.whenToUse; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </div>
            <div class="tradeoff-box cons">
              <span class="box-title">⚠️ When To Avoid (Pitfalls)</span>
              <ul>
                @for (item of pat.whenToAvoid; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </div>
          </div>

          <div class="code-section">
            <div class="code-header">
              <span class="code-title"
                >Idiomatic Angular 22 Implementation Example:</span
              >
            </div>
            <pre class="code-block"><code>{{ pat.codeSample }}</code></pre>
          </div>
        </div>
      }

      <!-- Comparison Matrix Table -->
      <div class="matrix-card">
        <h4 class="matrix-heading">
          Comprehensive Architectural Comparison Matrix
        </h4>
        <div class="table-wrapper">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Evaluation Dimension</th>
                <th>Service + Signals</th>
                <th>Service + RxJS</th>
                <th>NgRx SignalStore</th>
                <th>NgRx Global Store</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Reactivity Model</strong></td>
                <td>Push-pull Glitch-free Signals</td>
                <td>Push Observable Streams</td>
                <td>Push-pull Signals + rxMethod</td>
                <td>Observable Slices (or toSignal)</td>
              </tr>
              <tr>
                <td><strong>Boilerplate Level</strong></td>
                <td>Lowest (Zero framework)</td>
                <td>Low-Medium (Subjects)</td>
                <td>Low (Declarative plugins)</td>
                <td>High (Actions/Reducers/Effects)</td>
              </tr>
              <tr>
                <td><strong>Zoneless Ergonomics</strong></td>
                <td>First-class native</td>
                <td>Requires async pipe / rxResource</td>
                <td>First-class native</td>
                <td>Requires selectSignal / toSignal</td>
              </tr>
              <tr>
                <td><strong>Entity Normalization</strong></td>
                <td>Manual object mapping</td>
                <td>Manual object mapping</td>
                <td>Built-in <code>withEntities()</code></td>
                <td>Built-in <code>@ngrx/entity</code></td>
              </tr>
              <tr>
                <td><strong>DevTools &amp; Time-Travel</strong></td>
                <td>Standard Browser DevTools</td>
                <td>Console logs / taps</td>
                <td>Custom Signal plugins</td>
                <td>Full Redux DevTools Extension</td>
              </tr>
              <tr>
                <td><strong>Best Use Case</strong></td>
                <td>Component UI / Form state</td>
                <td>Real-time stream aggregation</td>
                <td>Modular features (Recommended)</td>
                <td>Large enterprise cross-team state</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recruiter & Senior Architect Q&A Card -->
      <div class="interview-card">
        <div class="interview-header">
          <span class="interview-eyebrow"
            >Senior Developer &amp; Recruiter Q&amp;A</span
          >
          <h4 class="interview-title">
            Critical State Management Architecture Questions
          </h4>
        </div>

        <div class="faq-list">
          @for (faq of interviewFaqs; track faq.id) {
            <div class="faq-item" [class.open]="expandedFaqId() === faq.id">
              <button
                type="button"
                class="faq-question-btn"
                (click)="toggleFaq(faq.id)"
                [attr.aria-expanded]="expandedFaqId() === faq.id"
              >
                <span class="q-icon">💬</span>
                <span class="q-text">{{ faq.question }}</span>
                <span class="toggle-icon">{{
                  expandedFaqId() === faq.id ? '▲' : '▼'
                }}</span>
              </button>
              @if (expandedFaqId() === faq.id) {
                <div class="faq-answer">
                  <p>{{ faq.answer }}</p>
                  @if (faq.takeaway) {
                    <div class="takeaway-box">
                      <strong>Key Rule of Thumb:</strong> {{ faq.takeaway }}
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .architecture-guide-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-6, 1.5rem);
    }

    .advisor-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-5, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .advisor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-2, 0.5rem);
    }

    .advisor-title-group {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }

    .advisor-title-group .icon {
      font-size: 1.5rem;
    }

    .advisor-title {
      margin: 0;
      font-size: var(--font-size-base, 1rem);
      font-weight: 700;
      color: var(--color-text-default);
    }

    .advisor-sub {
      margin: 2px 0 0;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted);
    }

    .wizard-questions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
      gap: var(--space-3, 0.75rem);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem);
    }

    .question-block {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .q-label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .option-pills {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pill {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 6px var(--space-3, 0.75rem);
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-align: left;
      cursor: pointer;
      user-select: none;
      font: inherit;
      transition: all var(--motion-duration-fast) var(--motion-easing-standard);
    }

    .pill:hover {
      background: var(--color-bg-raised);
      color: var(--color-text-default);
      border-color: var(--color-border-strong);
    }

    .pill.active {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent-default);
      color: var(--color-accent-default);
      font-weight: 600;
    }

    .recommendation-result {
      background: var(--color-accent-subtle);
      border: 1px solid var(--color-accent-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .result-badge-row {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .result-label {
      font-size: var(--font-size-xs, 0.75rem);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--color-accent-default);
    }

    .result-rationale {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-default);
      line-height: 1.5;
      margin: 0;
    }

    .result-actions {
      margin-top: 4px;
    }

    .pattern-tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
      gap: var(--space-3, 0.75rem);
    }

    .pattern-tab-card {
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem);
      cursor: pointer;
      user-select: none;
      font: inherit;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all var(--motion-duration-fast) var(--motion-easing-standard);
    }

    .pattern-tab-card:hover {
      background: var(--color-bg-canvas);
      border-color: var(--color-border-strong);
    }

    .pattern-tab-card.active {
      border-color: var(--color-accent-default);
      background: var(--color-accent-subtle);
      box-shadow: 0 0 16px rgba(179, 18, 46, 0.15);
    }

    .tab-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }

    .tab-name {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 700;
      color: var(--color-text-default);
    }

    .tab-tagline {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      margin: 0;
      line-height: 1.4;
    }

    .pattern-detail-card {
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-5, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: var(--space-3, 0.75rem);
      border-bottom: 1px solid var(--color-border-default);
      padding-bottom: var(--space-4, 1rem);
    }

    .detail-eyebrow {
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--color-accent-default);
      display: block;
    }

    .detail-title {
      margin: 2px 0 4px;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .detail-tagline {
      margin: 0;
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-muted);
    }

    .metrics-cluster {
      display: flex;
      gap: var(--space-2, 0.5rem);
      flex-wrap: wrap;
    }

    .metric-chip {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 6px var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
    }

    .metric-chip .k {
      font-size: 0.6rem;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .metric-chip .v {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 700;
      color: var(--color-text-default);
      font-family: monospace;
    }

    .tradeoffs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
      gap: var(--space-3, 0.75rem);
    }

    .tradeoff-box {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .tradeoff-box.pros {
      border-left: 3px solid var(--color-success-default, #15803d);
    }

    .tradeoff-box.cons {
      border-left: 3px solid #f59e0b;
    }

    .box-title {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 700;
      color: var(--color-text-default);
    }

    .tradeoff-box ul {
      margin: 0;
      padding-left: 1.2rem;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .code-section {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      overflow: hidden;
    }

    .code-header {
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--color-stage-border, #26262b);
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    }

    .code-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-stage-muted, #9a9aa3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .code-block {
      margin: 0;
      padding: var(--space-4, 1rem);
      font-family: monospace;
      font-size: 0.75rem;
      line-height: 1.45;
      color: var(--color-stage-text, #f7f7f8);
      overflow-x: auto;
    }

    .matrix-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-5, 1.25rem);
    }

    .matrix-heading {
      margin: 0 0 var(--space-4, 1rem);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 700;
      color: var(--color-text-default);
    }

    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-xs, 0.75rem);
      text-align: left;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--color-border-default);
    }

    .comparison-table th {
      background: var(--color-bg-raised);
      color: var(--color-text-default);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
    }

    .comparison-table td {
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .comparison-table td strong {
      color: var(--color-text-default);
    }

    .spectrum-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
    }

    .spectrum-header {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .spectrum-title {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 700;
      color: var(--color-text-default);
    }

    .spectrum-sub {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .spectrum-track {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: var(--space-2, 0.5rem) 0;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .spectrum-step {
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 170px;
      flex: 1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .spectrum-step.highlight-tier {
      border-color: var(--color-accent-default);
      background: var(--color-accent-subtle);
    }

    .step-num {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-accent-default);
    }

    .spectrum-step strong {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-default);
    }

    .spectrum-step span {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      line-height: 1.35;
    }

    .spectrum-arrow {
      color: var(--color-text-muted);
      font-weight: 700;
    }

    .interview-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-5, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .interview-header {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .interview-eyebrow {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-accent-default);
    }

    .interview-title {
      margin: 0;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 700;
      color: var(--color-text-default);
    }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .faq-item {
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      overflow: hidden;
      transition: border-color var(--motion-duration-fast) ease;
    }

    .faq-item.open {
      border-color: var(--color-accent-default);
    }

    .faq-question-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      background: transparent;
      border: none;
      cursor: pointer;
      user-select: none;
      font: inherit;
      text-align: left;
    }

    .faq-question-btn:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .q-icon {
      font-size: 1rem;
    }

    .q-text {
      flex: 1;
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .toggle-icon {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .faq-answer {
      padding: 0 var(--space-4, 1rem) var(--space-4, 1rem);
      border-top: 1px solid var(--color-border-default);
      padding-top: var(--space-3, 0.75rem);
    }

    .faq-answer p {
      margin: 0 0 var(--space-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .takeaway-box {
      background: var(--color-bg-surface);
      border-left: 3px solid var(--color-accent-default);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      border-radius: var(--radius-sm, 0.25rem);
      font-size: 0.7rem;
      color: var(--color-text-default);
    }

    .takeaway-box strong {
      color: var(--color-accent-default);
    }

    @media (max-width: 640px) {
      .advisor-card,
      .spectrum-card,
      .pattern-detail-card,
      .matrix-card,
      .interview-card {
        padding: var(--space-4, 1rem);
      }

      .detail-header {
        flex-direction: column;
        gap: var(--space-3, 0.75rem);
      }

      .metrics-cluster {
        width: 100%;
      }

      .metric-chip {
        flex: 1;
        min-width: 90px;
      }

      .wizard-questions,
      .pattern-tabs,
      .tradeoffs-grid {
        grid-template-columns: 1fr;
      }

      .table-wrapper {
        padding-bottom: var(--space-2, 0.5rem);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgRxVsServicesComponent {
  readonly expandedFaqId = signal<string | null>('signals-vs-ngrx');

  toggleFaq(id: string): void {
    this.expandedFaqId.update((curr) => (curr === id ? null : id));
  }

  readonly interviewFaqs = [
    {
      id: 'signals-vs-ngrx',
      question: 'Does Angular Signals replace NgRx in Angular 22?',
      answer:
        'No. Angular Signals is a fine-grained reactivity and change detection primitive (solving how the UI updates synchronously without Zone.js overhead). NgRx is a state architecture framework (solving how state is organized, normalized in O(1) dictionaries, shared across lazy features, audited via DevTools, and coordinated across complex asynchronous streams). They work in synergy: NgRx exposes signals for template binding.',
      takeaway:
        'Use Signals to expose data to templates; use NgRx to architect, normalize, and coordinate state lifecycle.',
    },
    {
      id: 'anti-pattern',
      question: 'When is NgRx considered an anti-pattern or over-engineering?',
      answer:
        'NgRx is an anti-pattern for simple CRUD applications with independent pages, isolated forms, and zero cross-feature state sharing. Writing Actions, Reducers, and Selectors just to toggle an isModalOpen boolean or submit a 3-field form introduces needless ceremony and indirection without tangible benefit.',
      takeaway:
        'Default to simple Signal Services or Component state; promote to SignalStore when state is shared or requires normalized caching.',
    },
    {
      id: 'signalstore-vs-global',
      question:
        'Why choose NgRx SignalStore over traditional NgRx Global Store?',
      answer:
        'SignalStore reduces boilerplate by ~80% while retaining full type-safety and immutability. It requires no action types or reducer switch statements, is 100% tree-shakeable, supports modular plugin composition (withEntities, withComputed, withMethods), and connects seamlessly to RxJS via rxMethod.',
      takeaway:
        'For new Angular features in 2026, SignalStore is the recommended default standard.',
    },
    {
      id: 'optimistic-rollback',
      question:
        'How do you handle optimistic UI updates with rollback in NgRx?',
      answer:
        'In SignalStore, call patchState(store, updateEntity(optimisticData)) immediately upon user action. The rxMethod then triggers the backend HTTP call; if the network call fails, the tapResponse error callback executes patchState(store, updateEntity(previousSnapshot)) and displays a user error toast.',
      takeaway:
        'Always capture previous state before optimistic mutations to enable instant rollback upon error.',
    },
  ];

  // Wizard state inputs
  readonly stateScope = signal<'local' | 'modular' | 'global'>('modular');
  readonly asyncComplexity = signal<'simple' | 'streams' | 'choreography'>(
    'simple',
  );
  readonly auditLevel = signal<'standard' | 'strict'>('standard');

  readonly selectedPatternKey = signal<PatternKey>('signal-store');

  readonly wizardRecommendation = computed(() => {
    const scope = this.stateScope();
    const asyncType = this.asyncComplexity();
    const audit = this.auditLevel();

    if (audit === 'strict' || asyncType === 'choreography') {
      return {
        winner: 'NgRx Global Store + Effects',
        patternKey: 'global-store' as PatternKey,
        rationale:
          'Your requirement for strict compliance, time-travel auditability, or cross-feature event choreography makes the classic NgRx Store and Effects the safest choice. Actions document every transaction in Redux DevTools.',
      };
    }

    if (scope === 'local' && asyncType === 'simple') {
      return {
        winner: 'Service with Signals (signal & computed)',
        patternKey: 'service-signals' as PatternKey,
        rationale:
          'For co-located UI state or single-feature components with straightforward CRUD, a plain injectable Service with Signals offers zero boilerplate and instantaneous push-pull reactivity with 0kB overhead.',
      };
    }

    if (asyncType === 'streams' && scope === 'local') {
      return {
        winner: 'Service with RxJS (BehaviorSubject)',
        patternKey: 'service-rxjs' as PatternKey,
        rationale:
          'When you need complex stream coordination, debounced search, or WebSockets within a local component without global entity indexing, an RxJS Service leverages full operator power.',
      };
    }

    // Default senior recommendation for Angular 22
    return {
      winner: 'NgRx SignalStore (@ngrx/signals)',
      patternKey: 'signal-store' as PatternKey,
      rationale:
        'The modern gold standard for Angular 22 Zoneless! SignalStore provides modular state composition (withEntities, withMethods, rxMethod), type-safety, and native signals with a tiny 1.5kB footprint.',
    };
  });

  readonly patterns: ArchitectureComparison[] = [
    {
      key: 'service-signals',
      name: 'Service with Signals',
      tagline:
        'Pure Angular 22 signals, writable signal() and derived computed().',
      badge: 'simplest',
      bundleWeight: '0 kB (Built-in)',
      reactivityModel: 'Push-Pull Glitch-Free',
      learningCurve: 'Gentle',
      timeTravelSupport: 'None',
      whenToUse: [
        'Component-local UI state (modals, tabs, pagination, active rows)',
        'Simple CRUD services without normalized cross-entity relationships',
        'Small to medium applications where team wants zero third-party dependencies',
        'Direct synchronous derivations using computed()',
      ],
      whenToAvoid: [
        'Multi-entity normalized collections needing $O(1)$ lookups by ID',
        'Complex cross-feature state orchestration across independent micro-frontends',
        'Regulated applications requiring Redux DevTools time-travel auditing',
      ],
      codeSample: `@Injectable({ providedIn: 'root' })
export class CounterService {
  private readonly _count = signal(0);
  readonly count = this._count.asReadonly();
  readonly double = computed(() => this._count() * 2);

  increment(): void {
    this._count.update(c => c + 1);
  }
}`,
    },
    {
      key: 'service-rxjs',
      name: 'Service with RxJS',
      tagline:
        'Observable event streaming with BehaviorSubject and higher-order operators.',
      badge: 'stream-heavy',
      bundleWeight: '~4 kB (RxJS)',
      reactivityModel: 'Push Stream Observables',
      learningCurve: 'Moderate',
      timeTravelSupport: 'Manual',
      whenToUse: [
        'Complex stream orchestration (switchMap, debounceTime, combineLatest)',
        'Real-time streaming inputs (WebSockets, SSE, Canvas animation loops)',
        'Managing async request cancellation and retry-backoff policies',
      ],
      whenToAvoid: [
        'Simple synchronous state where async pipes clutter templates',
        'Zoneless components where signal-first change detection is preferred',
        'Teams prone to memory leaks from unclosed subscriptions',
      ],
      codeSample: `@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly query$ = new Subject<string>();
  readonly results$ = this.query$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.http.get<Item[]>(\`/api/search?q=\${q}\`))
  );

  search(q: string): void {
    this.query$.next(q);
  }
}`,
    },
    {
      key: 'signal-store',
      name: 'NgRx SignalStore',
      tagline:
        'Modern functional composition: withEntities, withMethods, rxMethod & withHooks.',
      badge: 'recommended',
      bundleWeight: '~1.5 kB (@ngrx/signals)',
      reactivityModel: 'Native Signals + rxMethod',
      learningCurve: 'Moderate',
      timeTravelSupport: 'Custom Plugin',
      whenToUse: [
        'Recommended default for modern Angular 22 & Zoneless applications',
        'Modular feature state requiring entity normalization (ids array + entityMap)',
        'Async stream integration using rxMethod without manual subscriptions',
        'Composing reusable custom plugins across multiple feature teams',
      ],
      whenToAvoid: [
        'Extremely strict enterprise requirements strictly demanding Redux DevTools extension replay',
        'Tiny single-line ephemeral states where a simple signal() suffices',
      ],
      codeSample: `export const UsersStore = signalStore(
  { providedIn: 'root' },
  withEntities<User>(),
  withState({ isLoading: false }),
  withMethods((store, usersApi = inject(UsersApi)) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() => usersApi.getAll().pipe(
          tapResponse({
            next: users => patchState(store, setAllEntities(users), { isLoading: false }),
            error: err => patchState(store, { isLoading: false })
          })
        ))
      )
    )
  }))
);`,
    },
    {
      key: 'global-store',
      name: 'NgRx Global Store + Effects',
      tagline:
        'Classic Redux: ActionGroups, Feature Reducers, Memoized Selectors, and Effects.',
      badge: 'enterprise',
      bundleWeight: '~15-20 kB (@ngrx/store+effects)',
      reactivityModel: 'Action-Driven Redux',
      learningCurve: 'Steep',
      timeTravelSupport: 'Full Redux DevTools',
      whenToUse: [
        'Large enterprise apps with multiple distributed development teams',
        'Mission-critical financial or compliance workflows requiring full action auditing',
        'Complex cross-feature event choreography and multi-entity global caching',
        'Strict architectural boundaries where components are completely decoupled from side-effects',
      ],
      whenToAvoid: [
        'Simple CRUD applications where Redux boilerplate slows down development velocity',
        'Performance-sensitive micro-frontends prioritizing tiny bundle footprints',
      ],
      codeSample: `export const OrdersActions = createActionGroup({
  source: 'Orders',
  events: {
    'Load Orders': emptyProps(),
    'Load Orders Success': props<{ orders: Order[] }>(),
  }
});

export const ordersFeature = createFeature({
  name: 'orders',
  reducer: createReducer(
    initialState,
    on(OrdersActions.loadOrdersSuccess, (state, { orders }) => ({ ...state, orders }))
  )
});`,
    },
  ];

  selectPattern(key: PatternKey): void {
    this.selectedPatternKey.set(key);
  }

  currentPattern = computed(() => {
    return this.patterns.find((p) => p.key === this.selectedPatternKey());
  });
}
