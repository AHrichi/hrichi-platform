# ADR-0009: Typed content, audience modes, SEO and a generated CV

- **Status:** Accepted
- **Date:** 2026-10-26
- **Milestone:** M1

## Context

The site serves recruiters, engineers and clients, who need different first impressions. Search engines and link previews need real metadata. The CV must never disagree with the site.

## Decision

- **Typed content** (`@ah/shared/content`): profile, experience, case studies, services and per-audience copy are TypeScript data with interfaces, not a CMS. Integrity tests check:
  - unique, URL-safe slugs
  - service "proof" pointing at real case studies
  - internal CTAs pointing at real routes
  - roles in date order
- **Audience modes:** `PreferencesStore` (NgRx SignalStore, a shared singleton) holds `recruiter | engineer | client`.
  - The prerendered HTML is always the default (recruiter).
  - After hydration, `afterNextRender` restores `?for=` or the stored choice, so hydration never sees a mismatch.
  - The home page changes its headline, CTAs, section order and featured case studies.
- **SEO** (`@ah/portfolio/util-seo`): each page sets its title, description, canonical URL and Open Graph tags while it prerenders. The home page adds `Person` JSON-LD. `prepare-hosting.mjs --sitemap` writes `sitemap.xml` and `robots.txt` from Angular's `prerendered-routes.json`. `tools/scripts/og-image.mjs` renders the 1200×630 preview image.
- **CV as a page:** `/cv` is a print-styled route. On deploy, `tools/scripts/cv-pdf.mjs` prints the prerendered page with Chromium (JavaScript off, print media) to `/ahmed-hrichi-cv.pdf`, a tagged A4 PDF.
- **Contact:** `mailto:` links with a subject per intent, plus LinkedIn and GitHub. The NestJS lead pipeline comes after launch.
- **Quality gate:** Lighthouse CI (`nx lighthouse shell`) on four pages. It requires Accessibility and SEO 100, Best Practices ≥ 95, Performance ≥ 90 and CLS ≤ 0.05, and warns above 2 s LCP.

## What M1 found

1. With `break-inside: avoid` on each role, the long first role jumped to page 2 of the PDF and left the "Experience" heading stranded. Roles now flow across pages, while headings stay with their content and bullets never split. The CV is two pages.
2. Lighthouse simulates slow 4G from real transfer sizes, and the local static server sent everything uncompressed (979 KB a page). `serve-static.mjs` now compresses with brotli or gzip like Cloudflare, giving about 330 KB a page.
3. Measured on the production-like build: Performance 98–99, Accessibility, Best Practices and SEO 100, LCP 1.5–1.9 s on simulated mobile.
4. Vitest exits with an error when a project has no test files. Every feature lib now has page tests instead of `passWithNoTests`.

## Consequences

- Content changes are code changes: reviewed, tested and deployed by CI.
- Audience switching happens after hydration, so a `?for=client` link shows the recruiter text for one frame first.
- The CI deploy job installs Chromium for the PDF step.
