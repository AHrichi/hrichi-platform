# ADR-0013: Orbit API: Spring Boot 4, Orekit, a polite CelesTrak cache, JVM on Render

- **Status:** Accepted; the satellite catalogue and passes are superseded by [ADR-0017](0017-night-planner.md)
- **Date:** 2026-10-27
- **Milestone:** M2

## Context

The architecture planned a Spring Boot pricing engine behind a 3D quoting lab. Quote3D was dropped because it read like the product of a previous employer; the Orbit lab replaces it. Its backend still has to show Java and Spring Boot in a real setting, cost nothing on Render's free plan (0.1 CPU, 512 MB, sleeps after 15 minutes), and never make the static site wait.

The data is CelesTrak's public GP catalog. CelesTrak allows one download per data update (about every two hours), answers a repeat with 403, and firewalls an address after 50 errors in two hours. Render's free outbound addresses are shared with other customers.

## Decision

- **`apps/orbit-api`:**
  - Java 25, Spring Boot 4.1 (Web MVC, Validation, Actuator, Data MongoDB) and springdoc-openapi 3.2.
  - Orekit 13 for SGP4 propagation and pass events.
  - A Gradle 9.8 Kotlin DSL build; the foojay toolchain resolver downloads Java 25 when the machine has an older JDK.
  - Nx sees it through a plain `project.json` (`build`, `test`, `serve` via `tools/scripts/gradle.mjs`), tagged `scope:orbit`, `type:app`, `runtime:jvm`.
- **Ingestion** (`CatalogRefresher`, `RefreshPolicy`):
  - One request for the Active group in OMM JSON, only when the data is more than 6 hours old **and** the last attempt was more than 2 hours ago.
  - Every attempt is recorded in MongoDB, including failures, so a restart (Render wakes the instance often) can't ask again early.
  - A 403 or 404 ends all attempts until the next window.
  - Groups (stations, Starlink, GNSS, weather, other) are derived locally from that one download, as CelesTrak asks.
  - A bundled snapshot of the 155 brightest satellites (`tools/scripts/orbit-snapshot.mjs`, one request when run) covers an empty database.
- **Serving on a tenth of a CPU** (`Catalog`):
  - Each response is serialised and gzipped once per download, not per request; groups on their first request.
  - MongoDB stores the gzipped response itself, as one document of about 1.1 MB.
  - After a restart, the stored bytes are served at once and decoded for lookups in the background. Until then, details and passes answer `503` with `Retry-After: 5`.
  - `ETag`, `If-None-Match` and `304` are supported.
- **API:**
  - `GET /satellites?group=` (OMM objects that satellite.js reads directly)
  - `GET /satellites/{noradId}` (orbit class, period, apogee, perigee)
  - `GET /satellites/{noradId}/passes` (rise, culmination, set, and naked-eye visibility: satellite sunlit while the observer's sun is below −6°)
  - Errors are RFC 9457 problem details. Invalid parameters are listed one by one.
  - CORS allows GET from the portfolio and the lab only.
- **Orekit without data files:**
  - The leap-second table is in code (`LeapSeconds`, an `UTCTAIOffsetsLoader`).
  - Passes are computed in GTOD without Earth-orientation corrections; these move a pass by well under a second, far below what a TLE promises.
  - The Sun comes from `AnalyticalSolarPositionProvider`, so there are no JPL ephemerides.
- **Contract-first:**
  - A test writes `apps/orbit-api/openapi.json`.
  - `openapi-typescript` generates `@ah/shared/api-client`, which declares an implicit dependency on `orbit-api`.
  - CI regenerates both and fails on any difference.
- **Hosting:**
  - A Render web service from `render.yaml`. Render builds `apps/orbit-api/Dockerfile`: JRE 25, an extracted Boot jar, and a Java 25 AOT cache recorded in a training run at build time. It deploys after CI passes.
  - `MONGODB_URI` is copied from the lead API (`fromService`); the data lives in the `orbit` database on the same free cluster.

## The native-image spike

Both images were measured locally in Docker with Render's free limits (`--cpus=0.1 --memory=512m`). The test catalog held 16,821 satellites, served from a local stand-in for CelesTrak so the real one wasn't asked twice in a window.

|                                    | JVM (`Dockerfile`)         | GraalVM native (`Dockerfile.native`)         |
| ---------------------------------- | -------------------------- | -------------------------------------------- |
| Image build                        | 3 min, on Render's builder | 11 min, about 6 GB of memory                 |
| Image size                         | 633 MB                     | 304 MB                                       |
| Spring context started             | 26 s                       | 2.8 s                                        |
| Full catalog served after a wake   | 40.5 s                     | about 4 s (9.4 s before background indexing) |
| Pass prediction (first, then warm) | 3.1 s, 1.2 s               | 1.1 s, 0.7 s                                 |
| Memory (RSS)                       | 187 MB                     | 147 MB                                       |

Native is clearly faster, but it doesn't ship yet:

- Render's builder can't build it (about 6 GB of memory), so CI would build it, push it to GHCR and call a Render deploy hook. That needs two one-time steps from the owner: the deploy-hook secret and a public package.
- Render's documentation doesn't say whether free instances run prebuilt images.
- Native images fail only at run time when reflection metadata is missing. Unit tests on the JVM can't catch it.

The JVM image deploys with no manual step. The lab never waits for it, because it shows the bundled snapshot meanwhile. `Dockerfile.native` and its hints stay in the repository, verified, so switching is a Blueprint change plus a CI job.

## What M2 found

1. **Gradle can't run in this Windows sandbox** ("Unable to establish loopback connection"). Builds and tests ran in the official `gradle:9.8.2-jdk25` image, with a named volume for the Gradle cache and a throwaway MongoDB on a Docker network. CI runs Gradle directly on Linux.
2. **Spring Boot 4 moved things:**
   - Mongo settings are `spring.mongodb.*`.
   - Jackson 3 lives in `tools.jackson.*`; its annotations keep `com.fasterxml.jackson.annotation`.
   - Health contributors moved to `org.springframework.boot.health.contributor`.
   - `@WebMvcTest` moved to `org.springframework.boot.webmvc.test.autoconfigure`.
   - Slice tests ignore `@ConfigurationPropertiesScan`, so the properties are enabled by `OrbitConfig`, which the test imports.
3. **A bean named `catalog` twice:** the health indicator's explicit name clashed with the `Catalog` component. Actuator already derives `catalog` from `CatalogHealthIndicator`.
4. **The GraalVM plugin makes every test run do AOT processing.** It is applied only with `-Pnative`.
5. **The first real download blocked startup** for 38 s, during which `/satellites` had nothing to serve. Startup now serves the stored or bundled data at once and refreshes in a background virtual thread.
6. **Decoding is the cost, not the database:** at 0.1 CPU, mapping 16,821 MongoDB documents or parsing 7 MB of JSON takes the JVM about 25 s. Storing and serving the gzipped response as-is removed it from the path to the first byte.
7. **Hipparchus builds arrays reflectively** (`MathArrays.buildArray`). The first native image failed every pass prediction with `MissingReflectionRegistrationError` for `UnivariateDerivative2[]`. The fix is `NativeHints`, which registers the array types, Orekit's IERS tables and the snapshot. Only running the native binary showed it.
8. **There are 16,821 active satellites,** not the 11,000 planned. The full response is 7.1 MB of JSON, 1.1 MB gzipped.
9. **Verified:**
   - 40 JUnit tests, against a real MongoDB 8.0.
   - Over Tunis, the ISS's next 12 passes match satellite.js 7.1 (an independent SGP4 implementation): rise and set within 5 s, culmination within 0.3°.
   - The refresh rules: no second request inside the window across restarts, a snapshot when CelesTrak refuses an empty database, the last good data kept when a refresh fails.
   - The OpenAPI contract and problem details.

## Consequences

- CelesTrak sees at most one request per 6 hours from this API, and none while the free instance sleeps.
- A woken instance needs about 40 s before it serves the live catalog. The lab covers this with its snapshot and says so.
- `openapi.json` and `@ah/shared/api-client` are part of every API change; CI enforces it.
- Moving to the native image is ready when cold starts matter more than zero-ops deploys.
