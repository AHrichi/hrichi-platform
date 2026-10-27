# Home Dashboard Feature

The Home page (`src/app/pages/home-page`) serves as the entry point and main dashboard of the Strategy App.

## 🏠 Feature Overview

The dashboard is designed to give users a high-level overview of their financial workspaces. It provides:

- A summary of all existing scenarios.
- The ability to create new scenarios, clone existing ones, or delete them.
- Quick high-level stats or summaries of the "active" or primary scenario.
- Navigation gateways to jump directly into the Editor, Analytics, or Ledger views for a selected scenario.

## 🤖 AI Agent Context

When modifying the Home Dashboard, observe the following patterns:

### Interactivity

- Scenario selection should invoke `store.setActiveScenarioId(id)`. This updates the globally selected scenario, meaning navigating to the Editor or Ledger will immediately reflect the chosen scenario.
- Deleting a scenario should ideally have a confirmation dialog (or rely on native `window.confirm`) to prevent accidental data loss.

### Data Flow

- The home page primarily reads the `store.scenarios()` list.
- When creating a new scenario, a default boilerplate (defined in `src/app/store/initial-state.ts`) is generated, saved to the database, and set as active.

### UX/UI Considerations

- Keep the dashboard lightweight. It should load instantly.
- Scenario cards should clearly distinguish the active scenario visually (e.g., via borders, elevation, or distinct colors).
