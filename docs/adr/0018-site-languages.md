# ADR-0018: Three site languages, chosen at runtime

- **Status:** Accepted
- **Date:** 2026-10-31
- **Milestone:** M2

## Context

The site serves people in Tunisia, France and further afield: English, French and Arabic, with Arabic written right to left. Three problems showed up in the first attempt:

- Two pages kept their own language state: the `/apps` hub, and LuxPath with its own service. Each wrote `lang` and `dir` on `<html>`, so they could disagree with each other and with the header's switch.
- Arabic flipped every page to right to left, including pages that only exist in English, which broke their layout.
- The store defaulted to French while prerendered pages are English.

## Decision

- **One source of truth:** `PreferencesStore.language` (`en | fr | ar`), shared as a federation singleton like the audience and theme.
  - Prerendered HTML is English.
  - After hydration, `restore()` applies the stored choice, else the browser's language if the site speaks it, else English.
  - `setLanguage()` sets `lang` and `dir` on `<html>`. Nothing else writes them.
- **Each app owns its words**, typed: a copy object per language whose type comes from the English one, so a missing French or Arabic string fails the build. No runtime translation library: the words ship with the code that shows them.
  - The shell's header and footer: `apps/portfolio/shell/src/app/shell-copy.ts`.
  - The `/apps` hub.
  - LuxPath: `libs/products/lighting/feature/src/lib/i18n`, with `Intl` number and date formats per language. Arabic keeps Latin digits and a decimal point, as engineering documents in the Maghreb do.
- **English-only pages say so.** `isTranslatedPage()` lists the pages written in all three languages. In French or Arabic, any other page gets `lang="en" dir="ltr"` on `<main>` and a one-line note in the reader's language. The header and footer still follow the chosen language.
- **Right to left is part of each component's contract:**
  - Layout uses logical properties (`inline`/`block`, `start`/`end`).
  - `ah-tabs` and `ah-segmented-control` swap the arrow keys when the page is right to left.
  - `ah-modal` takes a translated `closeLabel`.
  - Drawings keep their geometry left to right and isolate translated words (U+2068/U+2069), so an Arabic word next to a number stays in place.

## Consequences

- Switching languages never reloads the page or refetches anything; LuxPath's tab title follows the switch too.
- The case studies, CV, experience and services pages, PulseOps, StudyLM, Strategy and ChatPulse are still English-only. Each can be translated on its own: add its copy, then add it to `isTranslatedPage()`.
- The language isn't in the URL, so search engines index the English pages only. A per-locale prerender (`/fr/…`, `/ar/…`) can come later if search in French or Arabic matters.
- `shell-e2e` checks the switch, the Arabic layout and the English-only note under the production CSP.
