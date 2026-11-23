# Greenhouse design system

How the Greenhouse Labor Planner looks and behaves, and how to build a screen that fits. It sits on the platform's design system (`@ah/ui`, the token pipeline, ADR-0008) and adds three things: a **look**, a **UI kit** and **brand packs**.

## Principles

1. **The field comes first.** Supervisors work with gloves, wet hands and sun glare. Field controls are a size up from the platform's: 64px, against its 48px.
2. **Arabic first, right to left.** Layout uses logical properties only, and icons that point (back, next) flip under `dir="rtl"`. Arabic-Indic digits are accepted in every number field.
3. **The phone says where the data is.** Every screen shows whether entries are sent, waiting or refused, in words and colour, never colour alone.
4. **Accessible by construction.** WCAG 2.2 AA contrast is checked when the tokens build. Template accessibility lint is on, at error level. Storybook runs axe on every story.
5. **One farm's colours, never hard-coded.** Components use semantic tokens; a farm's brand changes the tokens, not the components.

## The look: `data-look="greenhouse"`

The two app shells set `data-look="greenhouse"` on their root. The look lives in `libs/design-system/tokens/tokens/look.greenhouse.{light,dark}.json`. It overrides only the accent family and the focus ring:

| Token                  | Light       | Dark        | Used for                                  |
| ---------------------- | ----------- | ----------- | ----------------------------------------- |
| `color.accent.solid`   | `green.700` | `green.700` | The app bar, primary buttons              |
| `color.accent.default` | `green.700` | `green.400` | Links, ghost buttons, accent text         |
| `color.accent.subtle`  | `green.50`  | `green.950` | Hover tints                               |
| `color.focus.ring`     | `blue.700`  | `blue.300`  | Focus outlines, kept apart from the green |

Everything else (surfaces, text, status colours, spacing, type, motion) is the platform's. The token build's contrast gate checks the look in both themes.

## The UI kit: `@ah/products/greenhouse/ui`

Selector prefix `gh`. Shared by the field app and the dashboard; every part has a story under **Greenhouse/UI Kit** in Storybook.

| Part                                  | Use it for                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `gh-app-bar`                          | The top of every screen: the brand's logo (or `gh-mark`), the product name, projected actions         |
| `gh-lang-switch`                      | Language toggles on the app bar (`ع` · `FR` · `EN`)                                                   |
| `ghButton`                            | Every button and button-like link: `primary`, `secondary`, `danger`, `ghost`; `size="field"`; `block` |
| `gh-stepper`                          | Counts and quantities: large − and + around a number field that takes Latin and Arabic digits         |
| `gh-status-chip`                      | An entry's state: `pending`, `synced`, `rejected`, always with its word                               |
| `gh-badge-scanner`                    | QR badge scanning with the back camera, where the browser can                                         |
| `gh-mark`                             | The default mark when no brand logo is set                                                            |
| `.gh-card`                            | A panel on the canvas                                                                                 |
| `.gh-label`, `.gh-input`, `.gh-error` | Text fields with their label and error, at field size                                                 |

The kit's shared classes live in `src/styles/greenhouse.scss`, which both apps and Storybook load once. Components keep their own styles in their `.scss` files.

## Building a screen

- Use the kit's parts before writing new CSS. A screen's own `.scss` lays out the screen and nothing else.
- Use tokens only: no hex values or named colours. Use logical properties (`margin-inline`, `inset-block-start`).
- Put every visible string in `copy.{en,fr,ar}.ts`, and avoid plurals in templates (`short by {n}`), since Arabic has six plural forms.
- Give an error its field's `aria-describedby`. A status that changes gets `role="status"`, and an urgent one `role="alert"`.

## Brand packs

A brand pack dresses both apps in one farm's name, logo and colours for a private demo or that farm's own deployment. The public repo commits only `apps/products/greenhouse/brands/example/`; every other pack is git-ignored. Branded builds (`build:brand-demo`, `brand-local`, `brand-production` for the field app, `build:brand` for the dashboard) read `brands/active/`. See [brands/README.md](../../apps/products/greenhouse/brands/README.md).

A pack's CSS overrides the accent tokens under `[data-brand='<id>']` in light and dark. It must keep the same contrast the gate enforces: accent text at 4.5:1 or more on every surface, and text on the solid accent at 4.5:1 or more.
