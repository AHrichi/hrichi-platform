# State Management (NgRx SignalStore)

The `src/app/store` directory is the most critical part of the application. It acts as the single source of truth, managing both the UI state and the complex financial projection logic.

## 🧠 Architecture Overview

The app uses **NgRx SignalStore**, a lightweight, reactive, signals-based state management library.

### Key Files

- **`financial.store.ts`**: The main store definition. It composes the state, methods, and computeds into a single injectable token (`FinancialStore`).
- **`models.ts`**: Contains all the TypeScript interfaces and types for Scenarios, Incomes, Expenses, and Goals.
- **`initial-state.ts`**: The default boilerplate state used when creating a new scenario or initializing an empty database.
- **`methods.ts`**: The mutating functions. Any change to the state (adding an expense, changing a scenario name) must go through a method. These methods also trigger IndexedDB syncs.
- **`computeds.ts`**: The mathematical engine of the app. It takes the raw inputs (incomes, expenses) and runs a loop to project wealth over time, applying inflation and yield rates.
- **`db.ts`**: The Dexie (IndexedDB) database schema and instance.
- **`hooks.ts`**: Contains the `onInit` lifecycle hook for the store, responsible for loading the initial data from Dexie into the SignalStore when the app starts.

## 🤖 AI Agent Context

If you are an AI agent extending the application's logic, **READ THIS CAREFULLY**:

### 1. Computed Projections (`computeds.ts`)

- **Do not put side effects in computeds.** They must be pure functions deriving output from the state signals.
- Financial projection math is heavy. If you add new tax brackets or complex amortization schedules, do it here, but be mindful of the `O(n)` complexity where `n` is the number of years projected.
- If you need to add a new property to the projection output (e.g., `totalTaxesPaid`), add it to the `ProjectedYear` interface in `models.ts` and compute it in the main loop inside `computeds.ts`.

### 2. State Mutation (`methods.ts`)

- State in SignalStore is updated via `patchState`.
- Every method that modifies persistent data (e.g., `addIncome`, `updateExpense`) **must** also persist the updated active scenario to IndexedDB.
- We rely on `db.scenarios.put(updatedScenario)` within the methods to ensure data isn't lost on refresh.

### 3. Database (`db.ts`)

- The IndexedDB database name is `FinancialStrategyDB2`. If the schema changes fundamentally, increment the version number in `db.ts` or write a migration.
- If a user reports "old demo data persists", it's usually an IndexedDB caching issue. Instruct them to clear their browser storage or rename the DB.
