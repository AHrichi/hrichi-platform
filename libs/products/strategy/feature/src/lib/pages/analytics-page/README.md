# Analytics Feature

The Analytics page (`src/app/pages/analytics-page`) is responsible for providing deep insights into the user's financial scenarios through rich, interactive data visualization.

## 📊 Feature Overview

This feature aggregates projection data calculated by the NgRx SignalStore and presents it using `Chart.js`. It enables users to see their wealth trajectory, compare different scenarios, and analyze the breakdown of their income and expenses over time.

### Key Components

- **Wealth Projection Chart**: Displays net worth over the lifetime of the scenario.
- **Income vs. Expenses Breakdown**: Visualizes the flow of money in and out per year.
- **Scenario Comparison (`scenario-compare`)**: Allows users to select multiple scenarios and plot their net worth trajectories on the same graph to evaluate which strategy yields the best long-term outcome.

## 🤖 AI Agent Context

When modifying or extending the Analytics feature, please adhere to the following guidelines:

### Data Source

- The page relies **exclusively** on the computed signals from the NgRx SignalStore (e.g., `store.scenarioProjections()`).
- Do not perform heavy recalculations of compound interest, inflation, or tax within the analytics components themselves. All projection math must remain in `src/app/store/computeds.ts`.

### Charting Library

- We use `ng2-charts` which wraps `Chart.js` v4.
- When updating chart data dynamically, ensure you re-assign the chart datasets array (or update references) so that Angular's change detection combined with Signals triggers the chart to re-render.
- Plugins like `chartjs-plugin-annotation` are used for drawing milestone markers or goal completion lines on the charts.

### Responsiveness

- Ensure that chart wrappers have relative positioning and `maintainAspectRatio: false` if they need to flex within grid layouts. Charts should naturally resize when the window or sidebar changes.
