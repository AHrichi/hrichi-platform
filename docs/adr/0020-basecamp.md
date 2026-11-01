# ADR-0020: Basecamp, a camping trip planner that needs no server

- **Status:** Accepted
- **Date:** 2026-11-01
- **Milestone:** M2

## Context

The portfolio's second phone-first product: a planner for a night out camping, built around the owner's own hobbies. It covers:

- a campsite on a map;
- the weather there;
- how good each night is for the stars;
- a packing list for the group;
- sharing the plan with friends.

It has to work at a campsite with no signal, cost nothing to host, and need no account.

## Decision

- **A federated product remote**, built like LuxPath (ADR-0019):
  - `product-basecamp` on port 4310, embedded at `/apps/basecamp`;
  - pure-TypeScript `product-basecamp-domain` and `product-basecamp-feature`;
  - English, French and Arabic through `BasecampI18n` and `PreferencesStore` (ADR-0018).
- **Local-first:**
  - Trips, gear and the last forecast per trip live in IndexedDB. The portfolio's demo uses its own database, `ah-demo-basecamp` (ADR-0002).
  - A new device starts empty, and a sample weekend in the Aïn Draham forest loads on request.
- **Weather from Open-Meteo:**
  - It is free, needs no key, is licensed CC BY 4.0, and is credited on the screen and in `THIRD_PARTY_NOTICES.md`.
  - It gives daily values for the campsite's own time zone, up to 16 days ahead.
  - A forecast stays fresh for 3 hours. Offline, the saved one shows.
  - Frost, cold, wind, rain, storm and heat raise warnings, and add matching items (tarp, guy lines, thermals…) to the packing list without touching ticks.
  - `connect-src` allows `https://api.open-meteo.com`. The production CSP line is 1,791 characters, under Cloudflare's 2,000.
- **Stars computed on the phone:**
  - Each night uses the Sky lab's `nightSummary()` plus astronomy-engine sampling every 10 minutes for the Moon's altitude.
  - The score gives up to 70 for moonless dark hours and up to 30 for a shower near its peak, and loses up to 80 % under the forecast's cloud.
  - "Open this sky" links into the Sky lab at the darkest moment.
  - For this, `lab-sky-domain` is also tagged `scope:shared`. Its only dependencies are astronomy-engine and JSON. Because domain libraries may only import utilities, the night maths lives in the Basecamp feature lib as a pure module with its own specs.
- **Packing:**
  - Lists by trip type, each item a key the copy names in every language.
  - Quantities scale with people and nights.
  - Items are assigned to a person and filtered by person, and the list is matched against the user's gear.
- **Sharing with no server:**
  - A trip goes into the URL fragment as `#trip=` followed by the trip's JSON, deflated with `CompressionStream` and encoded as base64url. A weekend for three is about 1.5 kB.
  - Browsers never send the fragment, so the trip goes only where the link goes.
  - Opening the link adds a copy, then clears the fragment.
  - Backups are a versioned JSON file of all trips and gear.
- **A shared map picker:**
  - LuxPath's location picker became `@ah/platform/maps` (`ah-map-picker` and `Geocoder`), with its words passed in. LuxPath and Basecamp both use it.
  - It is not federated: `tools/federation/shared.mjs` now names the platform's shared libraries one by one. Federation ships a scope's libraries as one bundle, and a remote whose `@ah/platform` bundle held a library the shell's lacked loaded its own copy of `@ah/platform/app-mode`. It then ran as if standalone, with its own language switch and the real database instead of the demo one.
  - An e2e test guards this.

## Consequences

- No backend, no keys and nothing to pay for. A trip can be planned and used with the phone offline once the forecast has loaded.
- Friends get a copy, not a live list. Ticks don't sync back. A live shared list would need a server, such as a Durable Object per trip, and is left for later.
- Tests:
  - The domain has 16 tests: packing, weather, backups and share links.
  - The feature has 7 tests: the nights, and the link encoding.
  - `shell-e2e` covers the empty start and the sample under axe, the forecast warnings and packing, the best night and its Sky lab link, ticking and sharing out items, a new trip on the map, share-link import in a second browser, backup and restore, Arabic RTL, and that remotes use the shell's app mode.
- Embedded apps no longer nest a second `<main>` inside the portfolio's (LuxPath included).
- `shell-e2e` now depends on `lab-sky`, `product-lighting` and `product-basecamp` as well as the shell, so a change to a remote alone runs it.
