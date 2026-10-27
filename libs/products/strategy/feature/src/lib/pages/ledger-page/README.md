# Ledger Feature

The Ledger page (`src/app/pages/ledger-page`) acts as the chronological, year-by-year transactional log of a user's financial projection.

## 📖 Feature Overview

While the Analytics page provides a high-level visual summary and the Editor provides the inputs, the Ledger "shows the math." It lists every modeled transaction (income, expense, loan payment) sequentially to help users understand exactly how their wealth evolves.

### Key Aspects

- **Chronological Timeline:** The ledger generates a timeline spanning from the start year to the end of the projection.
- **Transaction Breakdown:** For every year, it itemizes:
  - Total Income
  - Total Expenses
  - End-of-year Balance
  - Target milestones (e.g., "Goal reached: Buy House")
- **Filtering & Pagination:** (If implemented) Allows users to jump to specific future decades or filter out noise like micro-transactions.

## 🤖 AI Agent Context

When maintaining or building upon the Ledger, keep these points in mind:

### Data Dependency

- The Ledger reads the array of calculated years from `store.scenarioProjections()`.
- The complex logic of determining _when_ an event happens (e.g., when a house is bought) is NOT in this UI component. It is entirely derived from `computeds.ts`. The ledger is merely a presentational layer for that timeline.

### Performance

- A projection spanning 50 years with dozens of transactions per year can result in a massive DOM structure.
- If extending the ledger with finer granularity (e.g., month-by-month tracking), ensure you implement Angular's `@defer` blocks or virtual scrolling (e.g., using `@angular/cdk/scrolling`) to avoid severe performance degradation.
