// Creates test accounts on the LOCAL Supabase stack (`supabase start`) and
// makes them members of the seed farm, so the apps can be tried end to end.
// It refuses any URL that isn't this machine: these passwords are for local
// development only.
//
// Usage (from the repo root, with the stack running):
//   node apps/products/greenhouse/supabase/scripts/local-users.mjs
import { execFileSync } from 'node:child_process';

const SUPABASE_CLI = [
  '-y',
  'supabase@3.1.0',
  '--workdir',
  'apps/products/greenhouse',
];
const SEED_FARM = '00000000-0000-4000-8000-000000000001';

/** Local-only test accounts; never use these anywhere else. */
export const LOCAL_PASSWORD = 'local-greenhouse-only';
export const LOCAL_USERS = [
  { email: 'manager@farm.test', role: 'manager', fullName: 'Manager (local)' },
  {
    email: 'supervisor@farm.test',
    role: 'supervisor',
    fullName: 'Supervisor A (local)',
  },
  {
    email: 'supervisor2@farm.test',
    role: 'supervisor',
    fullName: 'Supervisor B (local)',
  },
  { email: 'hr@farm.test', role: 'hr', fullName: 'HR (local)' },
];

function status() {
  const out = execFileSync('npx', [...SUPABASE_CLI, 'status', '-o', 'json'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const json = JSON.parse(out.slice(out.indexOf('{')));
  const url = json.API_URL;
  const key = json.SERVICE_ROLE_KEY ?? json.SECRET_KEY;
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url ?? '')) {
    throw new Error(`Not a local Supabase stack: ${url}`);
  }
  if (!key) throw new Error('No service key in `supabase status`');
  return { url, key };
}

async function call(base, key, method, path, body, prefer) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(prefer ? { prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null };
}

async function userId(base, key, email) {
  const created = await call(base, key, 'POST', '/auth/v1/admin/users', {
    email,
    password: LOCAL_PASSWORD,
    email_confirm: true,
  });
  if (created.status < 300) return created.json.id;
  // Already there: find it.
  const list = await call(
    base,
    key,
    'GET',
    '/auth/v1/admin/users?per_page=1000',
  );
  const found = list.json?.users?.find((u) => u.email === email);
  if (!found)
    throw new Error(
      `Could not create or find ${email}: ${JSON.stringify(created.json)}`,
    );
  return found.id;
}

const { url, key } = status();
for (const user of LOCAL_USERS) {
  const id = await userId(url, key, user.email);
  const member = await call(
    url,
    key,
    'POST',
    '/rest/v1/member?on_conflict=farm_id,user_id',
    {
      farm_id: SEED_FARM,
      user_id: id,
      role: user.role,
      full_name: user.fullName,
    },
    'resolution=merge-duplicates,return=minimal',
  );
  if (member.status >= 300) {
    throw new Error(
      `Could not add ${user.email} to the farm: ${JSON.stringify(member.json)}`,
    );
  }
  console.log(`${user.role.padEnd(10)} ${user.email}`);
}
console.log(`Password for all: ${LOCAL_PASSWORD} (local stack only)`);
