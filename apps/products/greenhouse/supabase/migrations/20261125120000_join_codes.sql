-- Greenhouse Labor Planner: people join a farm with a code, not an email
-- (ADR-0026). The project sends no email at all, so nothing proves that an
-- account owns its address; an invitation matched by email could be taken
-- by whoever signed up with that address first. A join code is handed over
-- in person or on WhatsApp instead, and only its holder can use it.
--
--   join_code           one code per person invited: role, name, expiry
--   create_join_code()  a manager makes one; returns the code
--   redeem_join_code()  the signed-in person joins the code's farm

drop trigger if exists claim_invitations on auth.users;
drop function if exists private.claim_invitations();
drop function if exists public.invite_member(uuid, text, public.member_role, text);
drop table if exists public.invitation;

create table public.join_code (
  -- 8 characters, no 0/O or 1/I: read aloud or typed from a photo.
  code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  farm_id uuid not null references public.farm (id) on delete cascade,
  role public.member_role not null,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  created_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
create index join_code_farm_idx on public.join_code (farm_id);

alter table public.join_code enable row level security;
-- Codes are made by create_join_code(); managers read and withdraw them.
grant select, delete on public.join_code to authenticated;
revoke all on public.join_code from anon;

create policy join_code_read on public.join_code
  for select to authenticated
  using (private.has_role(farm_id, '{manager}'));

create policy join_code_withdraw on public.join_code
  for delete to authenticated
  using (private.has_role(farm_id, '{manager}'));

-- A new code for one person. 40 random bits (8 characters of 32) from
-- gen_random_uuid(), skipping the version and variant bytes. Clears the
-- farm's expired codes on the way.
create function public.create_join_code(
  target_farm uuid,
  invitee_role public.member_role,
  invitee_name text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea;
  new_code text;
  attempt int := 0;
begin
  if not private.has_role(target_farm, '{manager}') then
    raise exception 'Only a manager of this farm can make join codes'
      using errcode = 'insufficient_privilege';
  end if;

  delete from public.join_code
    where farm_id = target_farm and expires_at <= now();

  loop
    attempt := attempt + 1;
    random_bytes := uuid_send(gen_random_uuid());
    new_code := '';
    for i in 0..7 loop
      new_code := new_code || substr(
        alphabet,
        get_byte(random_bytes, (array[0, 1, 2, 3, 4, 5, 10, 11])[i + 1]) % 32 + 1,
        1
      );
    end loop;
    begin
      insert into public.join_code (code, farm_id, role, full_name, created_by)
        values (new_code, target_farm, invitee_role, btrim(invitee_name), (select auth.uid()));
      return new_code;
    exception when unique_violation then
      if attempt >= 5 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

revoke all on function public.create_join_code(uuid, public.member_role, text) from public;
grant execute on function public.create_join_code(uuid, public.member_role, text) to authenticated;

-- The signed-in person joins the farm the code belongs to, under the name
-- and role the manager chose, and the code is used up. Spaces, dashes and
-- lower case are ignored. Someone already on the farm takes the new role
-- (the farm still keeps a manager). Returns the farm.
create function public.redeem_join_code(join_code text) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := upper(regexp_replace(coalesce(join_code, ''), '[^A-Za-z0-9]', '', 'g'));
  hit public.join_code;
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Sign in before joining a farm'
      using errcode = 'insufficient_privilege';
  end if;

  select * into hit from public.join_code c
    where c.code = clean and c.expires_at > now()
    for update;
  if hit.code is null then
    -- 22023: PostgREST answers 400, which the apps read as "refused".
    raise exception 'This join code is not valid or has expired'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.member (farm_id, user_id, role, full_name)
    values (hit.farm_id, me, hit.role, hit.full_name)
    on conflict (farm_id, user_id) do update
      set role = excluded.role;
  delete from public.join_code c where c.code = hit.code;
  return hit.farm_id;
end;
$$;

revoke all on function public.redeem_join_code(text) from public;
grant execute on function public.redeem_join_code(text) to authenticated;
