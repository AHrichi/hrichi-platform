import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FinancialStore } from '../../financial.store';
import { ThemeService } from '../../services/theme.service';
import { fmtCurrency } from '../../utils/chart-utils';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-net-worth-page',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './net-worth-page.component.html',
  styleUrls: ['./net-worth-page.component.scss'],
})
export class NetWorthPageComponent {
  readonly store = inject(FinancialStore);
  readonly themeService = inject(ThemeService);
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly fmtCurrency = fmtCurrency;
  readonly Math = Math;

  readonly netWorth = computed(() => {
    return this.store.accounts().reduce((sum, a) => {
      const txns = this.store
        .transactions()
        .filter((t) => t.accountId === a.id);
      let net = a.initialBalance;
      for (const t of txns) {
        if (t.type === 'income') net += t.amount;
        else if (t.type === 'expense') net -= t.amount;
        else if (t.type === 'transfer') {
          if (t.fromAccountId === a.id) net -= t.amount;
          if (t.accountId === a.id) net += t.amount;
        }
      }
      return sum + net;
    }, 0);
  });

  readonly accountBalances = computed(() => {
    return this.store.accounts().map((a) => {
      const balance = this.store
        .transactions()
        .filter((t) => t.accountId === a.id)
        .reduce((sum, t) => {
          if (t.type === 'income') return sum + t.amount;
          if (t.type === 'expense') return sum - t.amount;
          if (t.fromAccountId === a.id) return sum - t.amount;
          if (t.accountId === a.id) return sum + t.amount;
          return sum;
        }, a.initialBalance);
      return { ...a, balance };
    });
  });

  readonly balanceHistory = computed(() => {
    const txns = [...this.store.transactions()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const monthlyMap = new Map<string, number>();
    for (const t of txns) {
      const month = t.date.slice(0, 7);
      const prev = monthlyMap.get(month) || 0;
      if (t.type === 'income') monthlyMap.set(month, prev + t.amount);
      else if (t.type === 'expense') monthlyMap.set(month, prev - t.amount);
    }
    let running = this.store.currentBalance();
    const months: string[] = [];
    const values: number[] = [];
    const sorted = [...monthlyMap.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [month, net] of sorted) {
      running -= net;
      months.push(month);
      values.push(running);
    }
    return { months, values };
  });

  readonly chartData = computed(() => ({
    labels: this.balanceHistory().months,
    datasets: [
      {
        data: this.balanceHistory().values,
        label: 'Net Worth',
        fill: true,
        tension: 0.4,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        pointRadius: 0,
        pointHitRadius: 10,
      },
    ],
  }));

  readonly chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: {
          callback: (v: any) => (typeof v === 'number' ? fmtCurrency(v) : v),
        },
      },
    },
  };
}
