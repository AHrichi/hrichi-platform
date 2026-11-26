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
- **Keyboard contract written down.** Each component's doc comment describes its keyboard behaviour, and its spec tests it: modal (Escape, focus in and back out), select (`aria-activedescendant`, skipping disabled options, typeahead), colour swatch and segmented control (roving tabindex, RTL-aware arrow keys), flip card (a real toggle button, inert hidden face), the range controls (below).
- **Signal APIs.**
  - `input()`, `model()` for two-way values, `output()`;
  - host bindings in `host: {}`;
  - form controls implement `FormValueControl` (Signal Forms).
- **Generic, not product-specific.** A component joins `@ah/ui` when more than one page needs it. Single-product widgets belong in that product's library.

## Range controls

Four ways to set a number, so a form isn't a column of sliders. Pick the one that suits the value:

| Control            | For                                                                                     | Pointer                                                |
| ------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `<ah-stepper>`     | A count, or a range far too wide to drag (`adaptive`: 12 345 → 13 000 → 14 000)         | Tap − or +; hold to repeat, faster the longer you hold |
| `<ah-dial>`        | A share (`gauge`, a half moon), or a value that wraps round (`clock`: hours, weeks)     | Drag the knob, or tap the face                         |
| `<ah-thermometer>` | A temperature; the colour follows the temperature itself (`cold`, `hot`), not the range | Drag the column, or tap the tube                       |
| `<ah-ruler>`       | A measured value on a bounded scale                                                     | Swipe the tape, flick it to coast, or tap a mark       |

- **Keyboard.** The stepper's middle is a native spinbutton; Page Up and Page Down make a big nudge. The others are WAI-ARIA sliders: arrows by a step, Page keys by a tenth of the range (the ruler: label to label), Home and End. A clock wraps round.
- **Right to left.** Horizontal ones mirror (the bulb on the right, bigger numbers to the left), and so do their Left and Right keys. They read the `dir` attribute (`:host-context([dir='rtl'])`): the build rewrites `:dir()` into a language check, which a page with `dir` but no `lang` fails.
- **Beside a typed field**, set `companion`: the control leaves the tab order and the accessibility tree, and the field keeps the label and the keyboard.
- **Phones.** A vertical swipe over a control still scrolls the page (`touch-action: pan-y`); a short buzz marks the ends and the labels under a finger, except with reduced motion.
- **Forms.** Each implements `FormValueControl<number>`. `min` and `max` are typed as Signal Forms binds them (`number | undefined`); undefined keeps the default.

## Helpers

Not every export is a component. These are plain TypeScript, with no story of their own:

- **`StepTimeline`** is where a stepped visual is, and the controls that move it: step, seek, play, pause, speed (`SPEEDS`) and holds that stop playback until a check is answered. Autoplay keeps time against a wall-clock anchor, so a throttled tab catches up instead of drifting. A step shows for `STEP_MS` at 1×; pass `new StepTimeline(realClock, { stepMs })` to change that, or a fake `Clock` in tests.
- **`injectReducedMotion()`** returns a signal that tracks `prefers-reduced-motion: reduce`. The global CSS switch doesn't reach animations started from script, so code that animates with the Web Animations API reads this. Call it in an injection context.

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
