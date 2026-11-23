# Greenhouse Labor Planner: Supabase

The Postgres schema, row-level security and storage bucket behind the planner's standalone mode ([ADR-0026](../../../../docs/adr/0026-greenhouse-labor-planner.md)). The portfolio demo never calls Supabase.

| File                              | What it holds                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `migrations/…_labor_schema.sql`   | Tables. Every reference carries the farm id, so rows can't point into another farm    |
| `migrations/…_labor_security.sql` | Roles per farm, RLS on every table, server-side stamps, `create_farm()`, photo bucket |
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

Then run the field app against it:

```bash
pnpm nx serve product-greenhouse-field                 # dev server on 4314, local Supabase
pnpm nx build product-greenhouse-field -c local        # production build against local Supabase
```

Studio is at http://127.0.0.1:54323.

## A hosted project

```bash
pnpm dlx supabase --workdir apps/products/greenhouse link --project-ref <ref>
pnpm dlx supabase --workdir apps/products/greenhouse db push
```

A new farm comes from `select public.create_farm('Farm name', 'Your name')` while signed in; its creator becomes the manager.
