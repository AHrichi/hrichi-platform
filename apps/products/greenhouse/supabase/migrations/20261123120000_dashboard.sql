-- Greenhouse Labor Planner: what the manager's dashboard needs (ADR-0026).
--
--   invitation        people a manager has asked onto the farm, by email,
--                     before they have an account
--   invite_member()   adds someone who has an account, invites the rest
--   work_totals()     a day's work per team and greenhouse, so the
--                     dashboard reads weeks of history in a few hundred
--                     rows instead of thousands

create table public.invitation (
  farm_id uuid not null references public.farm (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email like '%_@_%'),
  role public.member_role not null,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  invited_by uuid,
  created_at timestamptz not null default now(),
  primary key (farm_id, email)
);
create index invitation_email_idx on public.invitation (email);

alter table public.invitation enable row level security;
grant select, insert, update, delete on public.invitation to authenticated;
revoke all on public.invitation from anon;

-- Only managers see or change who is invited.
create policy invitation_manage on public.invitation
  for all to authenticated
  using (private.has_role(farm_id, '{manager}'))
  with check (private.has_role(farm_id, '{manager}'));

-- Adds a person to the manager's farm: straight away when they already have
-- an account, otherwise as an invitation that their sign-up claims. Returns
-- 'added', 'updated' (they were a member; the role is changed) or 'invited'.
create function public.invite_member(
  target_farm uuid,
  invitee_email text,
  invitee_role public.member_role,
  invitee_name text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_email text := lower(btrim(invitee_email));
  existing uuid;
begin
  if not private.has_role(target_farm, '{manager}') then
    raise exception 'Only a manager of this farm can invite people'
      using errcode = 'insufficient_privilege';
  end if;

  select u.id into existing from auth.users u where lower(u.email) = clean_email;

  if existing is null then
    insert into public.invitation (farm_id, email, role, full_name, invited_by)
      values (target_farm, clean_email, invitee_role, btrim(invitee_name), (select auth.uid()))
      on conflict (farm_id, email) do update
        set role = excluded.role, full_name = excluded.full_name;
    return 'invited';
  end if;

  if exists (
    select 1 from public.member m
    where m.farm_id = target_farm and m.user_id = existing
  ) then
    -- keep_a_manager still guards the last manager.
    update public.member set role = invitee_role
      where farm_id = target_farm and user_id = existing;
    return 'updated';
  end if;

  insert into public.member (farm_id, user_id, role, full_name)
    values (target_farm, existing, invitee_role, btrim(invitee_name));
  return 'added';
end;
$$;

revoke all on function public.invite_member(uuid, text, public.member_role, text) from public;
grant execute on function public.invite_member(uuid, text, public.member_role, text) to authenticated;

-- A new account takes up every invitation sent to its email. With email
-- confirmation on, nobody can sign in to an address they don't own, so an
-- invitation only ever reaches its owner.
create function private.claim_invitations() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    return new;
  end if;
  insert into public.member (farm_id, user_id, role, full_name)
    select i.farm_id, new.id, i.role, i.full_name
    from public.invitation i
    where i.email = lower(new.email)
  on conflict (farm_id, user_id) do nothing;
  delete from public.invitation i where i.email = lower(new.email);
  return new;
end;
$$;

create trigger claim_invitations
  after insert on auth.users
  for each row execute function private.claim_invitations();

-- One row per day, team and greenhouse: kg, hours, crates and entries.
-- Runs as the caller, so row-level security still decides what they see.
create function public.work_totals(
  target_farm uuid,
  from_date date,
  to_date date
) returns table (
  work_date date,
  team_id uuid,
  greenhouse_id uuid,
  kg numeric,
  hours numeric,
  crates bigint,
  rejected_crates bigint,
  entries bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.work_date,
    l.team_id,
    l.greenhouse_id,
    sum(l.kg),
    sum(l.hours),
    sum(l.crates),
    sum(l.rejected_crates),
    count(*)
  from public.work_log l
  where l.farm_id = target_farm
    and l.work_date >= from_date
    and l.work_date < to_date
  group by l.work_date, l.team_id, l.greenhouse_id
  order by l.work_date, l.greenhouse_id;
$$;

revoke all on function public.work_totals(uuid, date, date) from public;
grant execute on function public.work_totals(uuid, date, date) to authenticated;
