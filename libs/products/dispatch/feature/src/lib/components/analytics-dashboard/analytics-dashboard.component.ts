import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';

@Component({
  selector: 'ah-analytics-dashboard',
  imports: [CommonModule],
  template: `
    <div class="analytics-wrapper">
      <div class="analytics-intro-bar">
        <div>
          <h2 class="section-title">Operations & SLA Analytics</h2>
          <p class="section-subtitle">
            Fleet efficiency, hospitality check-in compliance, subcontractor
            turnaround, and linen loss metrics.
          </p>
        </div>
      </div>

      <!-- Analytics Cards Grid -->
      <div class="charts-grid">
        <!-- Card 1: Throughput by Sector -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">Daily Linen Throughput by Sector</h3>
            <span class="card-tag">890 kg Total</span>
          </div>

          <div class="sector-bars">
            <div class="bar-row">
              <div class="bar-meta">
                <span class="bar-lbl"
                  >🏨 Luxury Hotels (Savoy, Dorchester, Rosewood)</span
                >
                <span class="bar-val">490 kg (55%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill fill-blue" style="width: 55%"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-meta">
                <span class="bar-lbl"
                  >🍽️ Fine Dining & Kitchens (Dishoom, Gymkhana)</span
                >
                <span class="bar-val">220 kg (25%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill fill-amber" style="width: 25%"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-meta">
                <span class="bar-lbl"
                  >🏠 High-End Airbnbs & Short-Lets (Kensington)</span
                >
                <span class="bar-val">110 kg (12%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill fill-pink" style="width: 12%"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-meta">
                <span class="bar-lbl"
                  >🧘 Spas, Gyms & Corporate Suites (Third Space)</span
                >
                <span class="bar-val">70 kg (8%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill fill-emerald" style="width: 8%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Subcontractor Laundry Performance -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">Subcontractor Plant SLAs & Quality</h3>
            <span class="card-tag">3 Facilities</span>
          </div>

          <div class="plants-benchmark">
            <div class="benchmark-item">
              <div class="b-top">
                <strong>Thames Valley Steam Laundry</strong>
                <span class="b-score text-success">98.4% On-Time</span>
              </div>
              <span class="b-sub"
                >Avg Turnaround: 3.8 hrs · Defect Rate: 0.6%</span
              >
              <div class="bench-track">
                <div class="bench-fill" style="width: 98.4%"></div>
              </div>
            </div>

            <div class="benchmark-item">
              <div class="b-top">
                <strong>Park Royal Linen Processors</strong>
                <span class="b-score text-success">99.0% On-Time</span>
              </div>
              <span class="b-sub"
                >Avg Turnaround: 3.5 hrs · Defect Rate: 0.4%</span
              >
              <div class="bench-track">
                <div class="bench-fill" style="width: 99%"></div>
              </div>
            </div>

            <div class="benchmark-item">
              <div class="b-top">
                <strong>Apex Clean London Ltd</strong>
                <span class="b-score text-success">97.1% On-Time</span>
              </div>
              <span class="b-sub"
                >Avg Turnaround: 4.2 hrs · Defect Rate: 0.9%</span
              >
              <div class="bench-track">
                <div class="bench-fill" style="width: 97.1%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Driver Punctuality & Drops -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">Driver Punctuality Ranking</h3>
            <span class="card-tag">London Fleet</span>
          </div>

          <div class="driver-ranking-list">
            <div class="rank-item">
              <span class="rank-badge">1</span>
              <div class="rank-meta">
                <strong>Carlos Mendez (Standby / Rapid)</strong>
                <span class="rank-zone"
                  >Zone 4 & Rapid Courier · 100% Punctual</span
                >
              </div>
              <span class="rank-score text-success">100%</span>
            </div>

            <div class="rank-item">
              <span class="rank-badge">2</span>
              <div class="rank-meta">
                <strong>Tariq Mahmood (Mayfair / Soho)</strong>
                <span class="rank-zone">Mercedes eVito · 8/12 completed</span>
              </div>
              <span class="rank-score text-success">99.1%</span>
            </div>

            <div class="rank-item">
              <span class="rank-badge">3</span>
              <div class="rank-meta">
                <strong>Liam O'Connor (Shoreditch / City)</strong>
                <span class="rank-zone"
                  >Ford Transit 350 · Commercial St delay</span
                >
              </div>
              <span class="rank-score text-warning">96.4%</span>
            </div>

            <div class="rank-item">
              <span class="rank-badge alert-badge">!</span>
              <div class="rank-meta">
                <strong>Harpreet Singh (Kensington / Chelsea)</strong>
                <span class="rank-zone"
                  >Breakdown near A40 · Rescued by Carlos</span
                >
              </div>
              <span class="rank-score text-danger">Incident</span>
            </div>
          </div>
        </div>

        <!-- Card 4: Linen Scrap & Damage KPI -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">Linen Scrap & Quality KPI</h3>
            <span class="card-tag">Industry Benchmark</span>
          </div>

          <div class="loss-kpi-wrap">
            <div class="loss-cell">
              <span class="loss-num text-success">0.72%</span>
              <span class="loss-lbl">Monthly Defect / Scrap Rate</span>
              <span class="loss-bench"
                >Target: &lt; 2.50% industry standard</span
              >
            </div>

            <div class="loss-cell">
              <span class="loss-num text-accent">£124.50</span>
              <span class="loss-lbl">Discrepancy Credits Recovered</span>
              <span class="loss-bench"
                >Deducted from partner plant invoices</span
              >
            </div>
          </div>

          <div class="loss-note">
            💡
            <em
              >Continuous RFID bag tagging & digital POD signatures reduce linen
              shrinkage and customer disputes by over 74%.</em
            >
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .analytics-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .analytics-intro-bar {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    }

    .section-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .section-subtitle {
      margin: 2px 0 0;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: var(--space-4, 1rem);
    }

    .chart-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .card-tag {
      font-size: 0.6875rem;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      padding: 2px 8px;
      border-radius: 9999px;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    /* Sector Bars */
    .sector-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bar-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bar-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .bar-lbl {
      color: var(--color-text-default);
      font-weight: 600;
    }

    .bar-val {
      font-family: var(--font-family-mono, monospace);
      font-weight: 700;
      color: var(--color-text-default);
    }

    .bar-track {
      height: 8px;
      background: var(--color-bg-canvas);
      border-radius: 9999px;
      overflow: hidden;
      border: 1px solid var(--color-border-default);
    }

    .bar-fill {
      height: 100%;
      border-radius: 9999px;

      &.fill-blue {
        background: #3b82f6;
      }
      &.fill-amber {
        background: #f59e0b;
      }
      &.fill-pink {
        background: #ec4899;
      }
      &.fill-emerald {
        background: #10b981;
      }
    }

    /* Plants Benchmark */
    .plants-benchmark {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .benchmark-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 8px 12px;
    }

    .b-top {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--color-text-default);
    }

    .b-score {
      font-weight: 800;
    }

    .b-sub {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .bench-track {
      height: 6px;
      background: var(--color-bg-surface);
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 4px;
    }

    .bench-fill {
      height: 100%;
      background: #10b981;
      border-radius: 9999px;
    }

    /* Driver Rankings */
    .driver-ranking-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rank-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 8px 12px;
    }

    .rank-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-accent-default);
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;

      &.alert-badge {
        background: #ef4444;
      }
    }

    .rank-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 0.8125rem;

      strong {
        color: var(--color-text-default);
      }
    }

    .rank-zone {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .rank-score {
      font-weight: 800;
      font-size: 0.875rem;
    }

    /* Loss KPI */
    .loss-kpi-wrap {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .loss-cell {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 12px;
      display: flex;
      flex-direction: column;
      text-align: center;
    }

    .loss-num {
      font-size: 1.5rem;
      font-weight: 800;
    }

    .loss-lbl {
      font-size: 0.75rem;
      color: var(--color-text-default);
      font-weight: 600;
      margin-top: 2px;
    }

    .loss-bench {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .loss-note {
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
      border-radius: var(--radius-md, 0.5rem);
      padding: 8px 12px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .text-success {
      color: #10b981 !important;
    }
    .text-warning {
      color: #f59e0b !important;
    }
    .text-danger {
      color: #ef4444 !important;
    }
    .text-accent {
      color: var(--color-accent-default) !important;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardComponent {
  readonly store = inject(DispatchStore);
}
