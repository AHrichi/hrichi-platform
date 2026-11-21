# System Design course: lesson authoring

Read the hard rules and the contracts in [technical-design.md](technical-design.md) (§0 and §3) first. This guide is what a content agent needs to add lessons and cheatsheets.

## 9. Lesson authoring (summary of `docs/system-design/lesson-authoring.md`)

**Adding a lesson:**

1. Create `libs/products/system-design/domain/src/lib/content/lessons/<module>/<id>.ts` exporting `export const lesson = { … } satisfies Lesson;`.
2. Add its `LessonMeta` to `content/curriculum.ts` in course order.
3. Add a cheatsheet `pattern` or `numbers` rows if it introduces one.
4. Run `pnpm nx test product-system-design-domain`. The content spec loads every lesson and fails on any `validateLesson` problem.
5. Look at it in `serve` and step through every step at desktop and phone widths, in light and dark.

**`validateLesson` checks** (each a unit-tested rule):

- ids are kebab-case and unique (steps, nodes, edges, zones, notes, checks);
- `meta.id === lesson.id`;
- 6–12 steps; first kind `problem`, last kind `recap`, and only the last is `recap`;
- length limits from §3;
- every op reference exists **at the time the op runs** (fold through the steps);
- no two nodes on the same grid cell at any step;
- packet edges exist at that step;
- `set-metric` ids are in `hud`;
- every `learn` index is in range and every learn item is ticked by some step;
- recap has 3–5 takeaways;
- checks: 3–8; choice answer in range with 2–5 distinct options; numeric tolerance in 0.05–0.5; order 3–6 distinct items;
- cards: 3–6, non-empty;
- the scene fits a 14 × 10 grid.

**Writing style:**

- **Every lesson:** a concrete, original scenario (a product with a problem), a story that adds one idea per step, numbers wherever possible (HUD), at least one `case` step showing the idea under stress, and one `watch-out`.
- **Body:** at most 80 words per step, plain English, second person, no jargon without a one-line definition. One callout per step at most, except the recap.

**Golden example: `request-journey`** (Phase 6 writes it in full; this is its outline):

- **Scenario:** you tap a recipe link on your phone, over mobile data, and the page takes 1.2 s.
- **HUD:** `DNS · Connect · Server · Transfer · Total`.
- **Steps:**

| #   | Label       | Kind      | What happens                                                                                                  |
| --- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Tap         | problem   | A phone sits on a green zone with the URL note `recipes.example/pasta`                                        |
| 2   | Name lookup | technique | A DNS resolver is added; request and response packets carry `recipes.example?` and `198.51.100.24`; DNS 40 ms |
| 3   | Handshake   | technique | The web server is added; 2 handshake waves; a TTL note on the DNS edge; Connect 120 ms                        |
| 4   | Request     | technique | `GET /pasta`                                                                                                  |
| 5   | Server work | technique | The app renders                                                                                               |
| 6   | Database    | technique | The database is added; a query packet; Server 90 ms                                                           |
| 7   | Response    | technique | `200 · 64 KB`; Transfer 60 ms; Total                                                                          |
| 8   | Assets      | technique | 3 parallel packets (images, CSS, JS) on one connection                                                        |
| 9   | Mobile      | case      | Higher RTT doubles Connect                                                                                    |
| 10  | Repeat      | case      | A warm DNS cache and kept-alive connection; the total drops                                                   |
| 11  | Recap       | recap     | A "where the time went" table note                                                                            |

## 10. Curriculum (44 lessons, 9 modules)

Each row gives: id · title · level · minutes, then the scenario and the beats the steps must cover. Content agents expand each row into a full lesson file.

**01 Foundations** (hue neutral)

- `request-journey` · One Request, End to End · B · 11. _Outline in §9._
- `latency-throughput` · Latency vs Throughput · B · 9. Lunchtime rush on a checkout API. Latency vs throughput; percentiles (p50, p95, p99, tail); utilisation → queueing blow-up; Little's law; capacity ceiling. HUD: RPS, p50, p99, Util.
- `napkin-math` · Back-of-the-Envelope Math · B · 12. Sizing a photo-sharing app. Latency numbers to know; DAU → average and peak RPS (÷86,400, ×3 peak); storage per year; bandwidth; read/write ratio; sanity checks. HUD: DAU, Avg RPS, Peak, Storage/yr.
- `availability` · Availability & the Nines · B · 9. A 99.9% promise on a status page. Nines → downtime; serial dependencies multiply; parallel redundancy; SLI/SLO/SLA; error budgets. HUD: Availability, Downtime/yr.

**02 Scaling** (hue blue)

- `scale-up-out` · Scale Up or Scale Out · B · 9. One server melting on launch day. Vertical limits; SPOF; horizontal scaling needs a load balancer and statelessness; cost curve.
- `load-balancing` · Load Balancing · B · 11. Three servers, one front door. Round robin; least connections; health checks; L4 vs L7; sticky sessions; redundant load balancers.
- `stateless-services` · Stateless Services · I · 9. Users logged out after a deploy. In-memory sessions break; shared session store or signed tokens; where state should live.
- `caching` · Caching · I · 12. A product page hammering the database. Cache-aside; hit-ratio maths; TTL and staleness; invalidation on write; write-through vs write-back; stampede and request coalescing; LRU. HUD: Hit ratio, DB load, p50.
- `cdn` · Content Delivery Networks · B · 9. Sydney users fetching images from Frankfurt. RTT and distance; edge PoPs; edge hit; origin shield; cache headers and purge; dynamic-content limits.
- `autoscaling` · Autoscaling · I · 9. Evening traffic doubles daily. Metric-driven scaling; warm-up lag; min/max; cooldown and flapping; scheduled scaling; the database doesn't autoscale the same way.

**03 Data & Storage** (hue violet)

- `sql-vs-nosql` · SQL vs NoSQL · B · 11. Orders vs activity events. Relational and ACID; document; key-value; wide-column; graph; access patterns decide; polyglot persistence.
- `indexes` · Indexes · I · 10. "Orders by email" scanning 50M rows. Full scan; B-tree lookup; composite index order; covering index; write cost. HUD: rows scanned, query ms.
- `storage-engines` · Storage Engines · A · 12. A write-heavy log store. B-tree pages and WAL; LSM memtable → SSTables → compaction; bloom filters; read vs write amplification.
- `replication` · Replication · I · 11. Reads outgrow one database. Leader/follower; read replicas; lag and read-your-writes; sync vs async; failover; multi-leader conflicts.
- `sharding` · Sharding · I · 11. A marketplace's order writes outgrow one machine. Range vs hash partitioning; hot partitions (a flash-sale seller); key design; cross-shard queries; resharding.
- `consistent-hashing` · Consistent Hashing · A · 10. Adding a cache node remaps every key. mod-N problem; hash ring; ~1/N keys move; virtual nodes; replicas on the ring.
- `unique-ids` · Unique IDs at Scale · I · 9. Two shards issue the same invoice number. Auto-increment collisions; UUIDv4; time-ordered UUIDv7/ULID; Snowflake-style layout; clock skew.
- `cap-consistency` · CAP & Consistency · A · 12. A link cut between two data centres. Partitions happen; C vs A during a partition; strong vs eventual; session guarantees; quorums (R + W > N); PACELC.
- `consensus` · Consensus & Leader Election · A · 12. Two nodes both think they lead. Split brain; majority quorum; terms; Raft-style election; log commit; fencing tokens.
- `transactions` · Transactions & Isolation · A · 12. Two buyers, one last concert seat. ACID; dirty read, lost update, write skew; isolation levels; locks vs MVCC; optimistic versions.
- `blob-storage` · Files, Blobs & Media · I · 10. Users upload 4K videos. Blobs out of the DB; object store plus metadata; pre-signed uploads; multipart and resumable; transcode via a queue; CDN delivery.

**04 Communication** (hue teal)

- `api-styles` · REST, RPC & GraphQL · B · 11. Mobile and web need different data. Resources, verbs and idempotency; gRPC internal and streaming; GraphQL shaping and N+1; versioning; cursor pagination.
- `api-gateway` · API Gateways · I · 9. Ten services, one public entry. Routing; auth and rate limits at the edge; aggregation/BFF; TLS termination; avoiding a gateway bottleneck.
- `message-queues` · Message Queues · I · 11. Confirmation emails slow checkout. Decouple with a queue; workers; at-least-once and idempotent consumers; backlog and backpressure; dead-letter queue. HUD: queue depth, checkout p50.
- `pub-sub` · Pub/Sub & Event Streams · I · 11. "OrderPlaced" that five teams need. Topics and fan-out; consumer groups; log streams with offsets and replay; per-key ordering; schema evolution.
- `realtime` · Polling, SSE & WebSockets · I · 10. Live courier tracking. Short polling cost; long polling; SSE; WebSockets; connection servers and fan-out over pub/sub; reconnects and presence.

**05 Reliability** (hue rose)

- `redundancy-failover` · Redundancy & Failover · I · 10. A data centre loses power. SPOFs; active-passive vs active-active; detection and failover time; multi-AZ/region; RPO and RTO.
- `rate-limiting` · Rate Limiting · I · 11. A script floods the login endpoint. Fixed window and edge bursts; sliding window; token bucket; distributed counters; 429 + Retry-After.
- `timeouts-retries` · Timeouts, Retries & Backoff · I · 10. A slow dependency stalls every thread. Missing timeouts; timeout budgets; retry storms; exponential backoff with jitter; idempotency keys.
- `circuit-breakers` · Circuit Breakers & Bulkheads · A · 10. A failing recommendations service takes down checkout. Cascades; closed/open/half-open; fallbacks; bulkheads; load shedding.
- `observability` · Logs, Metrics & Traces · I · 10. "It's slow", but where? RED/USE metrics; SLO alerts; structured logs with request ids; distributed tracing; sampling.

**06 Architecture** (hue amber)

- `monolith-microservices` · Monolith vs Microservices · I · 11. A growing team blocking each other. Modular monolith; boundaries by domain; independent deploys; network and data costs; data ownership.
- `service-discovery` · Service Discovery · A · 9. Instances come and go each minute. Hard-coded IPs; registry and heartbeats; client vs server-side discovery; DNS-based; sidecar mesh.
- `sagas` · Sagas & Distributed Transactions · A · 12. Booking flight + hotel + car. No global transaction; 2PC blocking; saga steps and compensations; orchestration vs choreography; transactional outbox.
- `batch-stream` · Batch vs Stream Processing · I · 10. Nightly sales report vs live fraud alerts. Batch jobs; windows; event vs processing time and late data; lambda/kappa; exactly-once caveats.

**07 Security** (hue green)

- `authentication` · Authentication · B · 10. Log in once, stay logged in. Password hashing (argon2/bcrypt); sessions vs tokens; expiry and refresh; OAuth/OIDC; MFA.
- `authorization` · Authorization · I · 9. A user opens someone else's invoice. AuthN vs AuthZ; RBAC; ownership/ABAC checks; enforce server-side; least privilege.
- `encryption-secrets` · Encryption & Secrets · I · 10. An API key leaked in a repo. TLS in transit; at rest; KMS and envelope encryption; secret managers and rotation; hashing ≠ encryption.

**08 Shipping** (hue teal)

- `testing-at-scale` · Testing Distributed Systems · I · 10. Green tests, broken production. Pyramid; contract tests; integration with real dependencies; load tests; chaos experiments.
- `cicd` · CI/CD & Safe Deploys · I · 10. A Friday deploy breaks checkout. Pipeline stages; feature flags; blue-green; canary with metric-based rollback; expand/contract migrations.

**09 Case Studies** (hue violet)

- `design-method` · A Method for Design Problems · B · 10. One vague prompt, 45 minutes. Requirements (functional and non-functional); estimates; API; data model; high-level design; deep dives; HLD vs LLD.
- `design-url-shortener` · Design a URL Shortener · I · 14. 100M new links a month. Estimates; base62 keys, counter ranges, key service; storage; cached redirect path; click analytics via a queue.
- `design-news-feed` · Design a News Feed · A · 15. Fresh posts for millions of followers. Fan-out on write vs read; hybrid for big accounts; feed cache; ranking; cursor pagination.
- `design-chat` · Design a Chat System · A · 15. 1:1 and group chat. WebSocket gateway; per-conversation partitions and ordering ids; receipts; offline push; presence; group fan-out.

**Cheatsheets** (one per module):

| Module        | Contents                                                                     |
| ------------- | ---------------------------------------------------------------------------- |
| Foundations   | Latency numbers, powers of two, nines table, RPS conversion                  |
| Scaling       | Load-balancing algorithms table, cache strategies table                      |
| Data          | Database families table, isolation-anomalies matrix, partitioning strategies |
| Communication | API styles table, delivery guarantees                                        |
| Reliability   | Failure patterns and their remedies                                          |
| Architecture  | Monolith vs microservices table, saga styles                                 |
| Security      | Token types, crypto primitives                                               |
| Shipping      | Deploy strategies                                                            |
| Case studies  | The method checklist, an estimate template                                   |
