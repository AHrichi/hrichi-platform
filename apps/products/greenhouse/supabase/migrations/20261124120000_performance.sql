-- Greenhouse Labor Planner: performance and labour cost (ADR-0026, G5).
--
--   team_week_totals()  a team's work per week: kg, hours, crates, and the
--                       labour cost of the hours whose pay is known
--   worker_totals()     each worker's work over a period, the same way
--
-- Both run as the caller, so row-level security still decides what they
-- see: supervisors read no pay, so their cost and paid hours come back 0.
-- Labour cost uses each worker's current hourly rate; pay has no history.
-- Mondays are computed with date arithmetic, never the session time zone.

create function public.team_week_totals(
  target_farm uuid,
  from_date date,
  to_date date
) returns table (
  week_start date,
  team_id uuid,
  kg numeric,
  hours numeric,
  crates bigint,
  rejected_crates bigint,
  labour_cost numeric,
  paid_hours numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.work_date - (extract(isodow from l.work_date)::integer - 1),
    l.team_id,
    sum(l.kg),
    sum(l.hours),
    sum(l.crates),
    sum(l.rejected_crates),
    coalesce(sum(l.hours * p.hourly_rate), 0),
    coalesce(sum(l.hours) filter (where p.hourly_rate is not null), 0)
  from public.work_log l
  left join public.worker_pay p
    on p.worker_id = l.worker_id and p.farm_id = l.farm_id
  where l.farm_id = target_farm
    and l.work_date >= from_date
    and l.work_date < to_date
  group by 1, 2
  order by 1, 2;
$$;

revoke all on function public.team_week_totals(uuid, date, date) from public;
grant execute on function public.team_week_totals(uuid, date, date) to authenticated;

create function public.worker_totals(
  target_farm uuid,
  from_date date,
  to_date date
) returns table (
  worker_id uuid,
  days bigint,
  kg numeric,
  hours numeric,
  crates bigint,
  rejected_crates bigint,
  labour_cost numeric,
  paid_hours numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.worker_id,
    count(distinct l.work_date),
    sum(l.kg),
    sum(l.hours),
    sum(l.crates),
    sum(l.rejected_crates),
    coalesce(sum(l.hours * p.hourly_rate), 0),
    coalesce(sum(l.hours) filter (where p.hourly_rate is not null), 0)
  from public.work_log l
  left join public.worker_pay p
    on p.worker_id = l.worker_id and p.farm_id = l.farm_id
  where l.farm_id = target_farm
    and l.work_date >= from_date
    and l.work_date < to_date
  group by l.worker_id
  order by l.worker_id;
$$;

revoke all on function public.worker_totals(uuid, date, date) from public;
grant execute on function public.worker_totals(uuid, date, date) to authenticated;
