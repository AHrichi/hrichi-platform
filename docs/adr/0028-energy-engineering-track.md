# ADR-0028: An energy engineering page and a second CV

- **Status:** Accepted
- **Date:** 2026-11-25
- **Milestone:** M2

## Context

The owner holds a National Engineering Degree in Energy Engineering (ENIM, 2017–2020) and wants to apply for energy engineering work as well as software roles. The site and its CV (ADR-0009) only told the software story: the degree appeared as "National Engineering Degree" with no specialty, and nothing linked it to the energy work already in the repo, SerraCalc (ADR-0027) and LuxPath (ADR-0019).

## Decision

- **One content source for the energy track:** `libs/shared/content/src/lib/energy.ts` holds an `EnergyProfile` per language (en, fr, ar, it, de): role, summary, degree, skill groups, target roles and the two `EngineeringProject`s. Every claim points at code in this repo (formulas, standards and test counts from the SerraCalc and LuxPath domains). The methods lists are shared constants, so they can't drift between languages.
- **The degree names its specialty everywhere:** the first `education` entry in all five bundles now reads "… in Energy Engineering" (Génie Énergétique, الهندسة الطاقية, Ingegneria Energetica, Energietechnik). A test checks that the energy degree equals that entry.
- **`/energy` page** in `portfolio-feature-experience` (`energyRoutes`), linked from the main nav as "Energy": degree, target roles, the two projects with their methods and a link into each app (hidden when the app is switched off in `PORTFOLIO_APPS_CONFIG`), and the skill groups. Prerendered.
- **`/cv/energy`** is the same `CvPage` with a `variant` input bound from route data (`withComponentInputBinding`), not a copy. The energy variant leads with education and languages, swaps in the energy role, summary and skills, adds an "Engineering projects" section with each app's public URL (readable on paper), and shortens the software roles to their context lines. Each CV links to the other on screen only.
- **Two PDFs:** `tools/scripts/cv-pdf.mjs` prints `/cv` to `site.cvFile` and `/cv/energy` to `site.energyCvFile` (`ahmed-hrichi-energy-cv.pdf`). Both are two A4 pages.

## Consequences

- Unit tests cover the energy page, both CV variants in English and French, and the five energy bundles (same projects, methods and list lengths in every language). The shell e2e checks both new pages are prerendered with their own titles.
- axe is clean on `/energy`, `/cv/energy` and `/cv` at 390 px and 1280 px, light and dark, with no sideways scroll.
- The energy CV holds only what the repo can prove. It has no internships, final-year project (PFE) or engineering software from the degree, because none are recorded anywhere.

## Next

- Ask the owner for the final-year project (topic, host company, dates), internships, and the engineering software used during the degree (for example EES, TRNSYS, PVsyst, DIALux, AutoCAD, MATLAB), then add them to `EnergyProfile` in all five languages. A `degree.details` list or an `internships: Role[]` field would carry them.
