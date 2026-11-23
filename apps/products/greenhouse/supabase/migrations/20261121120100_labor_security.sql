-- Greenhouse Labor Planner: who may read and write what (ADR-0026).
--
--   manager     everything on their farm
--   supervisor  reads the roster and plan; logs work and hygiene checks
--   hr          reads everything, pay included, and writes nothing
--
-- Nobody outside a farm sees any of its rows. Supervisors never see pay.
-- Tests: apps/products/greenhouse/supabase/spec/security.spec.ts.

create schema if not exists private;
grant usage on schema private to authenticated;

-- Helpers run as their owner so policies on `member` can't recurse; they
-- only ever answer about the signed-in user.
create function private.has_role(
  target_farm uuid,
  roles public.member_role[]
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member m
    where m.farm_id = target_farm
      and m.user_id = (select auth.uid())
      and m.role = any (roles)
  );
$$;

create function private.is_member(target_farm uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member m
    where m.farm_id = target_farm
      and m.user_id = (select auth.uid())
  );
$$;

-- A storage path's first folder as a farm id, or null if it isn't one.
create function private.farm_of_path(path text) returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return split_part(path, '/', 1)::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke all on function private.has_role(uuid, public.member_role[]) from public;
revoke all on function private.is_member(uuid) from public;
revoke all on function private.farm_of_path(text) from public;
grant execute on function private.has_role(uuid, public.member_role[]) to authenticated;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.farm_of_path(text) to authenticated;

-- Signed-in users only; the anonymous key reaches nothing.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.farm enable row level security;
alter table public.member enable row level security;
alter table public.greenhouse enable row level security;
alter table public.team enable row level security;
alter table public.worker enable row level security;
alter table public.worker_pay enable row level security;
alter table public.absence enable row level security;
alter table public.weekly_plan enable row level security;
alter table public.work_log enable row level security;
alter table public.hygiene_item enable row level security;
alter table public.hygiene_check enable row level security;
alter table public.target enable row level security;

-- Farms: members read; managers rename. Created through create_farm().
create policy farm_read on public.farm
  for select to authenticated
  using (private.is_member(id));
create policy farm_update on public.farm
  for update to authenticated
  using (private.has_role(id, '{manager}'))
  with check (private.has_role(id, '{manager}'));

-- Members: colleagues see each other; managers add, change and remove.
create policy member_read on public.member
  for select to authenticated
  using (private.is_member(farm_id));
create policy member_manage on public.member
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

-- The roster, the plan and the targets: everyone on the farm reads them,
-- managers write them.
create policy greenhouse_read on public.greenhouse
  for select to authenticated using (private.is_member(farm_id));
create policy greenhouse_manage on public.greenhouse
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

create policy team_read on public.team
  for select to authenticated using (private.is_member(farm_id));
create policy team_manage on public.team
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

create policy worker_read on public.worker
  for select to authenticated using (private.is_member(farm_id));
create policy worker_manage on public.worker
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

create policy absence_read on public.absence
  for select to authenticated using (private.is_member(farm_id));
create policy absence_manage on public.absence
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

create policy weekly_plan_read on public.weekly_plan
  for select to authenticated using (private.is_member(farm_id));
create policy weekly_plan_manage on public.weekly_plan
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

create policy hygiene_item_read on public.hygiene_item
  for select to authenticated using (private.is_member(farm_id));
create policy hygiene_item_manage on public.hygiene_item
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

create policy target_read on public.target
  for select to authenticated using (private.is_member(farm_id));
create policy target_manage on public.target
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

-- Pay: managers and HR only.
create policy worker_pay_read on public.worker_pay
  for select to authenticated
  using (private.has_role(farm_id, '{manager,hr}'));
create policy worker_pay_manage on public.worker_pay
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

-- Work logs: supervisors add entries for the last two weeks (a phone can
-- stay offline for days) and correct their own in that window; managers
-- write anything; deleting is for managers.
create policy work_log_read on public.work_log
  for select to authenticated using (private.is_member(farm_id));
create policy work_log_insert on public.work_log
  for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and (
      private.has_role(farm_id, '{manager}')
      or (
        private.has_role(farm_id, '{supervisor}')
        and work_date between current_date - 14 and current_date + 1
      )
    )
  );
create policy work_log_update on public.work_log
  for update to authenticated
  using (
    private.has_role(farm_id, '{manager}')
    or (
      private.has_role(farm_id, '{supervisor}')
      and recorded_by = (select auth.uid())
      and work_date >= current_date - 14
    )
  )
  with check (
    private.has_role(farm_id, '{manager}')
    or (
      private.has_role(farm_id, '{supervisor}')
      and recorded_by = (select auth.uid())
      and work_date between current_date - 14 and current_date + 1
    )
  );
create policy work_log_delete on public.work_log
  for delete to authenticated
  using (private.has_role(farm_id, '{manager}'));

-- Hygiene checks: a supervisor fills in their own until they sign it; a
-- signed check never changes.
create policy hygiene_check_read on public.hygiene_check
  for select to authenticated using (private.is_member(farm_id));
create policy hygiene_check_insert on public.hygiene_check
  for insert to authenticated
  with check (
    supervisor_id = (select auth.uid())
    and private.has_role(farm_id, '{manager,supervisor}')
  );
create policy hygiene_check_update on public.hygiene_check
  for update to authenticated
  using (
    signed_at is null
    and supervisor_id = (select auth.uid())
    and private.has_role(farm_id, '{manager,supervisor}')
  )
  with check (
    supervisor_id = (select auth.uid())
    and private.has_role(farm_id, '{manager,supervisor}')
  );
create policy hygiene_check_delete on public.hygiene_check
  for delete to authenticated
  using (signed_at is null and private.has_role(farm_id, '{manager}'));

-- The server, not the phone, says who wrote an entry and when it arrived.
create function private.stamp_work_log() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null then
      new.recorded_by := (select auth.uid());
    end if;
    if new.team_id is null then
      select w.team_id into new.team_id
      from public.worker w
      where w.id = new.worker_id and w.farm_id = new.farm_id;
    end if;
  else
    new.id := old.id;
    new.farm_id := old.farm_id;
    new.recorded_by := old.recorded_by;
  end if;
  new.synced_at := now();
  return new;
end;
$$;

create trigger work_log_stamp
  before insert or update on public.work_log
  for each row execute function private.stamp_work_log();

-- A farm always keeps a manager. Checked for signed-in users only, so the
-- service role can still delete a farm or an account (which cascades).
create function private.keep_a_manager() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
    and old.role = 'manager'
    and (
      tg_op = 'DELETE'
      or new.role <> 'manager'
      or new.farm_id <> old.farm_id
      or new.user_id <> old.user_id
    )
    and not exists (
      select 1
      from public.member m
      where m.farm_id = old.farm_id
        and m.role = 'manager'
        and m.user_id <> old.user_id
    )
  then
    raise exception 'A farm must keep at least one manager'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger member_keep_a_manager
  before update or delete on public.member
  for each row execute function private.keep_a_manager();

-- The one way to make a farm: its creator becomes its first manager.
create function public.create_farm(farm_name text, manager_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  new_farm uuid;
begin
  if uid is null then
    raise exception 'Sign in to create a farm'
      using errcode = 'insufficient_privilege';
  end if;
  insert into public.farm (name) values (farm_name) returning id into new_farm;
  insert into public.member (farm_id, user_id, role, full_name)
    values (new_farm, uid, 'manager', manager_name);
  return new_farm;
end;
$$;

revoke all on function public.create_farm(text, text) from public;
grant execute on function public.create_farm(text, text) to authenticated;

-- Hygiene photos: private bucket, one folder per farm
-- (`<farm id>/<check id>/<file>`).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hygiene-photos',
  'hygiene-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy hygiene_photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'hygiene-photos'
    and private.is_member(private.farm_of_path(name))
  );
create policy hygiene_photos_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'hygiene-photos'
    and private.has_role(private.farm_of_path(name), '{manager,supervisor}')
  );
create policy hygiene_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'hygiene-photos'
    and private.has_role(private.farm_of_path(name), '{manager}')
  );
