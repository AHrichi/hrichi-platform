# ADR-0017: The Orbit API becomes a night planner

- **Status:** Accepted
- **Date:** 2026-10-27
- **Milestone:** M2
- **Supersedes:** the satellite catalogue and pass predictions of ADR-0013 (its contract-first setup, hosting and Orekit choices stand)

## Context

The Sky lab (ADR-0016) shows no satellites, so the Orbit API's catalogue and pass predictions had no user left. A camper's real question is "which nights are dark enough to go?", and answering it needs event timing: when the Sun is 18° down, when the Moon rises and sets. That is Orekit's strength, and it gives the Spring Boot service a job worth showing.

## Decision

- **`GET /nights?lat&lon&days=1–30&zone`:** for each night from local noon to local noon:
  - sunset; civil, nautical and astronomical dusk and dawn; sunrise
  - moonrise and moonset
  - the Moon's lit fraction at local midnight
  - **dark windows**, where the Sun is below −18° and the Moon is down
  - meteor showers active at midnight
  - a 0–100 score: hours of moonless darkness up to six, plus up to 20 points for a busy shower
- **Times:** null when the event doesn't happen, such as polar night or a Moon that stays up. The contract marks those fields `string | null`.
- **Privacy:** coordinates are rounded to 0.1° (about 11 km), by the client and again by the server.
- **The Moon:** Orekit 13.1.9 has no analytical Moon (14.0 adds one), and JPL ephemerides are tens of megabytes. `AnalyticalMoon` instead combines:
  - Montenbruck and Pfleger's MiniMoon series for direction;
  - the main ELP-2000/82 distance terms from Meeus for parallax, nearly 1° for someone on the ground;
  - Orekit's mean-of-date frame.
- **The Sun:** Orekit's `AnalyticalSolarPositionProvider`, as before.
- **Events:** `BodyElevationDetector`, an Orekit `AbstractDetector`, fires when a body crosses an elevation over a `TopocentricFrame`.
  - It reads only the state's date, so a stand-in Keplerian propagator drives it, and Orekit's event machinery brackets and solves each crossing to a millisecond.
  - One propagation across all the nights runs five detectors: the Sun at −0.833°, −6°, −12° and −18°, and the Moon at −0.833°.
- **Meteor showers:** the same IMO table as the Sky lab. Render builds the image from `apps/orbit-api` only, so the API keeps a copy, and `MeteorShowersTest` fails if it differs from `libs/labs/sky/domain/src/lib/meteor-showers.json`. The rate formula matches the browser's.
- **Removed:**
  - CelesTrak ingestion, the refresh policy, the catalogue and its gzip payloads
  - SGP4 passes and the satellite endpoints
  - MongoDB, and with it `MONGODB_URI` in `render.yaml`

  The service is now pure computation with an in-memory LRU cache of 256 campsite-and-date plans.

- **The lab:** a "Best nights to go" panel lists 14 nights, with the best three marked. Choosing one jumps the sky, paused, to the middle of its longest dark window. It keeps the old client's wake-up behaviour: retries for up to 150 s, `Retry-After`, a "waking" state after 3 s.

## What M2 found

1. **The planner agrees with Astronomy Engine, an independent library, to within two minutes on every event** at six places:
   - Tunis on the Perseids' peak (a new Moon)
   - Sfax on the Geminids' peak
   - Reykjavík at midsummer (no astronomical dusk)
   - Tromsø in polar night (no sunset or sunrise)
   - Quito at the equinox
   - Sydney in winter

   `tools/scripts/sky-fixtures.mjs` writes the reference values. The Moon's position agrees to within 0.1° and 0.5% of distance across 2026.

2. **CelesTrak refused Render's outbound connections** on the first deploy, with a 10 s connect timeout, while it answered from elsewhere in 0.3 s. Dropping the catalogue removed the only outbound dependency.
3. **springdoc writes OpenAPI 3.1.** `@Schema(types = {"string", "null"})` makes a field nullable there, and openapi-typescript turns it into `string | null`.
4. **Speed:** 14 nights take 0.3 s on a desktop JVM, about ten times longer on Render's 0.1 CPU, and repeats come from the cache. The browser asks after the visitor stops changing place for 400 ms.
5. **Verified:**
   - JUnit: 13 tests, covering the Moon, the planner against the fixtures, showers and the file copy, the controller's problems and CORS, and the contract.
   - Vitest: the client's retries.
   - e2e: the planner panel with a mocked API on the CSP-allowed origin, and the jump to a night.
   - By hand: the production Docker image, run locally, planned 14 Tunis nights. Tonight's full Moon leaves no moonless darkness, and the windows grow as it wanes.

## Consequences

- The Orbit API keeps its name and its Render service (`ahmed-hrichi-orbit`); renaming would mean another Blueprint sync, and it still computes orbits, now of the Sun and the Moon.
- A shower table change edits both copies, and the test makes forgetting one fail CI.
- The Atlas `orbit` database is no longer used and can be dropped.
