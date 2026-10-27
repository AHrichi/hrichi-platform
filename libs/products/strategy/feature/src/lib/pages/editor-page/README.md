# Scenario Editor Feature

The Editor page (`src/app/pages/editor-page`) is the primary workspace for users to construct and fine-tune their financial strategies.

## 🛠️ Feature Overview

This page allows users to actively modify the details of a single scenario. It provides a comprehensive interface for managing all the building blocks of a financial projection:

- **Global Settings**: Editing the scenario name, starting balance, inflation rate, and projection duration.
- **Incomes**: Managing salary, passive income, and one-off windfalls.
- **Expenses**: Tracking recurring costs (fixed, variable, inflation-adjusted).
- **Goals**: Setting financial targets (e.g., buying a house, retirement) with specific target dates and amounts.

### Sub-components

The editor heavily utilizes modular components from `src/app/components`:

- `income-list`
- `expense-list`
- `goal-list`
- `scenario-settings`

## 🤖 AI Agent Context

When extending the Editor, keep these architectural constraints in mind:

### State Management

- The Editor subscribes to the currently active scenario in the SignalStore (`store.activeScenario()`).
- **Form State vs. Global State**: Since the SignalStore reacts instantly, modifying an input field bound directly to a store update method will cause the entire projection timeline to recalculate on every keystroke.
- **Performance Optimization**: Use `updateOn: 'blur'` in reactive forms or debounce inputs before calling store update methods to ensure smooth UI performance.

### Data Validation

- Ensure all forms have validators (e.g., amounts must be positive, dates must be valid strings).
- When a user deletes an item (e.g., an income stream), prompt for confirmation if the UI pattern requires it, but ultimately rely on `store.deleteIncome(id)` to handle the persistent state removal.

### IndexedDB Sync

- All changes made through the store methods (like `store.addExpense()`) are automatically synchronized to IndexedDB via the hooks layer. No manual Dexie database calls are needed in the UI components.
