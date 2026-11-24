# Greenhouse Labor Planner: Supabase

The Postgres schema, row-level security and storage bucket behind the planner's standalone mode ([ADR-0026](../../../../docs/adr/0026-greenhouse-labor-planner.md)). The portfolio demo never calls Supabase.

| File                              | What it holds                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `migrations/…_labor_schema.sql`   | Tables. Every reference carries the farm id, so rows can't point into another farm    |
| `migrations/…_labor_security.sql` | Roles per farm, RLS on every table, server-side stamps, `create_farm()`, photo bucket |
| `migrations/…_dashboard.sql`      | `save_plan_row()`, `work_totals()` (its email invitations are replaced by join codes) |
| `migrations/…_join_codes.sql`     | `join_code`, `create_join_code()`, `redeem_join_code()`                               |
| `migrations/…_performance.sql`    | `team_week_totals()`, `worker_totals()`: performance and labour cost                  |
| `seed.sql`                        | A made-up farm for local development, with no members                                 |
| `spec/security.spec.ts`           | The migrations and seed run against PGlite, acting as each role                       |
| `spec/supabase-stand-in.sql`      | The bits of Supabase the tests stand in for: API roles, `auth.uid()`, storage tables  |

## Who can do what

| Role       | Reads                        | Writes                                                                 |
| ---------- | ---------------------------- | ---------------------------------------------------------------------- |
| manager    | everything on the farm       | everything; can't remove the farm's last manager                       |
| supervisor | the roster, plan and targets | work logs (last 14 days; fixes their own), hygiene checks until signed |
| hr         | everything, pay included     | nothing                                                                |

Nobody sees another farm's rows, the anonymous key reaches no table, and pay (`worker_pay`) is never sent to supervisors' phones.

## Joining a farm

The project sends **no email** (it has to cost nothing, and Supabase's built-in mail only reaches the team's own addresses). An email address is only a sign-in name, and email confirmation stays **off**, so nothing proves who owns an address. People therefore join with a **join code**: a manager makes one on the dashboard's **People** screen (`create_join_code()`, 8 characters, works once, for 7 days) and hands it over in person or on WhatsApp. The person creates an account in either app and enters it (`redeem_join_code()`), which puts them on the farm with the name and role the manager chose. Only managers see and withdraw codes. A forgotten password can't be reset by email: the person makes a new account and gets a new code.

## Reading weeks of history

`work_totals(farm, from, to)` sums the work log per day, team and greenhouse, as the caller (RLS applies). The dashboard reads five weeks this way, a few hundred rows, which stays under the API's `max_rows` (1000). Single workers' logs would not.

The performance screen reads twelve weeks at most, the same way:

- `team_week_totals(farm, from, to)`: one row per week (from Monday) and team;
- `worker_totals(farm, from, to)`: one row per worker, so up to a thousand workers.

Both add the labour cost: each hour times the worker's **current** hourly rate (pay keeps no history), and the hours that had a rate. They run as the caller, so a supervisor, who can't read pay, gets the work with a cost of 0. Targets (`target`) hold from their week until the next one; managers set them, everyone on the farm reads them.

## Hygiene checks

A supervisor's phone keeps the checklist (`hygiene_item`) with the roster and fills in one `hygiene_check` per greenhouse and day, offline. Photos wait on the phone, then go to the private `hygiene-photos` bucket at `<farm id>/<check id>/<photo id>.jpg` (the first folder is what the storage policies check), always before the check that points at them.

- The check's id is made on the phone; it is upserted with `supervisor_id` set to the signed-in user, which RLS requires.
- Once `signed_at` is set, RLS refuses any further write, including the same upsert again. A phone that lost the reply to its signed upsert reads `signed_at` back and counts it as sent.
- One check per greenhouse and day (`unique (farm_id, check_date, greenhouse_id)`): a second supervisor starting the same one is refused, and the phone shows why.
- The dashboard reads photos through signed URLs that last an hour.
- A photo taken off an answer after it was uploaded stays in the bucket (only managers can delete there); nothing points at it any more.

## Tests

```bash
pnpm nx test product-greenhouse-supabase
```

They need no Docker: PGlite is Postgres compiled to WebAssembly.

## Local Supabase

Needs Docker. The CLI reads this folder as its `supabase/`. Use `npx`, not `pnpm dlx`: the CLI downloads its binary in a postinstall script, which pnpm skips.

```bash
npx -y supabase@3.1.0 --workdir apps/products/greenhouse start      # migrations + seed on first start
npx -y supabase@3.1.0 --workdir apps/products/greenhouse db reset   # start over
node apps/products/greenhouse/supabase/scripts/local-users.mjs      # test accounts on the seed farm
```

`local-users.mjs` creates a manager, two supervisors and an HR account (`*@farm.test`) with one local-only password, all printed by the script. It refuses to run against anything but `127.0.0.1`.

Then run the apps against it:

```bash
pnpm nx serve product-greenhouse-field                 # dev server on 4314, local Supabase
pnpm nx build product-greenhouse-field -c local        # production build against local Supabase
pnpm nx build product-greenhouse -c local              # the dashboard against local Supabase
pnpm nx serve-original product-greenhouse              # dashboard dev server on 4313, local Supabase
```

New migrations on a running stack, without losing its data:

```bash
npx -y supabase@3.1.0 --workdir apps/products/greenhouse migration up
```

Studio is at http://127.0.0.1:54323.

## A hosted project

```bash
pnpm dlx supabase --workdir apps/products/greenhouse link --project-ref <ref>
pnpm dlx supabase --workdir apps/products/greenhouse db push
```

A new farm comes from `select public.create_farm('Farm name', 'Your name')` while signed in; its creator becomes the manager.
