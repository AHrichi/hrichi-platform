# design-system-ui (`@ah/ui`)

Global styles and Angular components for every app in the platform (ADR-0008). The public catalogue is the Storybook at [design.ahmed-hrichi.workers.dev](https://design.ahmed-hrichi.workers.dev):

```bash
pnpm nx storybook design-system
```

## Using it

Apps load the styles in this order (see any app's `project.json`): Inter, then `libs/design-system/tokens/src/generated/tokens.css`, then `libs/design-system/ui/src/styles/index.scss`, then the app's own `styles.scss`. Components are standalone; import them from `@ah/ui`.

## Component rules

- **Tokens only.** Styles use semantic tokens from `design-system-tokens`. Stylelint enforces this, plus logical properties and no `transition: all`.
- **Native first.** Use the platform element when it carries the accessibility contract:
  - `<ah-modal>` is a native `<dialog>` opened with `showModal()` (focus trap, inert page, Escape, top layer);
  - `<ah-select>`'s list opens in the top layer with the Popover API.
- **Every interactive state.** Each component covers hover, `:focus-visible` (an outline, so it survives forced-colours mode), active, disabled and loading where relevant.
- **Keyboard contract written down.** Each component's doc comment describes its keyboard behaviour, and its spec tests it: modal (Escape, focus in and back out), select (`aria-activedescendant`, skipping disabled options, typeahead), colour swatch and segmented control (roving tabindex, RTL-aware arrow keys), flip card (a real toggle button, inert hidden face).
- **Signal APIs.**
  - `input()`, `model()` for two-way values, `output()`;
  - host bindings in `host: {}`;
  - form controls implement `FormValueControl` (Signal Forms).
- **Generic, not product-specific.** A component joins `@ah/ui` when more than one page needs it. Single-product widgets belong in that product's library.

## Checks

```bash
pnpm nx run-many -t lint test -p design-system-ui
```

```bash
pnpm lint:styles
```

```bash
pnpm nx e2e design-system-e2e
```

The last command runs axe on every story in both themes and compares screenshots. Regenerate baselines after an intended visual change with `pnpm nx run design-system-e2e:update-baselines` (needs Docker).
