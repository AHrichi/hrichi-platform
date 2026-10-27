import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { FinancialStore } from './financial.store';
import { StrategyAppComponent } from './strategy-app.component';

export const strategyRoutes: Routes = [
  {
    path: '',
    providers: [FinancialStore, provideCharts(withDefaultRegisterables())],
    component: StrategyAppComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home-page/home-page.component').then(
            (m) => m.HomePageComponent,
          ),
      },
      {
        path: 'editor',
        pathMatch: 'full',
        redirectTo: () => {
          const store = inject(FinancialStore);
          const scenarios = store.scenarios();
          if (scenarios.length === 0) return 'home';
          return `editor/${store.activeScenarioId()}/settings`;
        },
      },
      {
        path: 'editor/:scenarioId',
        loadComponent: () =>
          import('./pages/editor-page/editor-page.component').then(
            (m) => m.EditorPageComponent,
          ),
        children: [
          {
            path: 'settings',
            loadComponent: () =>
              import('./pages/editor-page/routes/settings-view.component').then(
                (m) => m.SettingsViewComponent,
              ),
          },
          {
            path: 'incomes',
            loadComponent: () =>
              import('./pages/editor-page/routes/incomes-view.component').then(
                (m) => m.IncomesViewComponent,
              ),
          },
          {
            path: 'expenses',
            loadComponent: () =>
              import('./pages/editor-page/routes/expenses-view.component').then(
                (m) => m.ExpensesViewComponent,
              ),
          },
          {
            path: 'goals',
            loadComponent: () =>
              import('./pages/editor-page/routes/goals-view.component').then(
                (m) => m.GoalsViewComponent,
              ),
          },
          { path: '', redirectTo: 'settings', pathMatch: 'full' },
        ],
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/analytics-page/analytics-page.component').then(
            (m) => m.AnalyticsPageComponent,
          ),
      },
      {
        path: 'ledger',
        loadComponent: () =>
          import('./pages/ledger-page/ledger-page.component').then(
            (m) => m.LedgerPageComponent,
          ),
      },
      {
        path: 'compare',
        loadComponent: () =>
          import('./components/scenario-compare/scenario-compare.component').then(
            (m) => m.ScenarioCompareComponent,
          ),
      },
      {
        path: 'net-worth',
        loadComponent: () =>
          import('./pages/net-worth-page/net-worth-page.component').then(
            (m) => m.NetWorthPageComponent,
          ),
      },
      {
        path: 'what-if',
        loadComponent: () =>
          import('./pages/whatif-page/whatif-page.component').then(
            (m) => m.WhatifPageComponent,
          ),
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./pages/help-page/help-page.component').then(
            (m) => m.HelpPageComponent,
          ),
      },
    ],
  },
];
