-- The parts of a Supabase database the migrations rely on, for the PGlite
-- tests only (never applied to a real project): the API roles, auth.users
-- and auth.uid(), and the storage tables with RLS switched on.
--
-- auth.uid() reads the JWT claims the way Supabase's does: PostgREST sets
-- `request.jwt.claims` for each request, the tests set it with set_config.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

grant usage on schema public to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key,
  email text unique
);

create function auth.uid() returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    ),
    ''
  )::uuid;
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid default auth.uid(),
  created_at timestamptz default now()
);

grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.buckets to authenticated;
alter table storage.objects enable row level security;
