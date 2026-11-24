import type { SupabaseClient } from '@supabase/supabase-js';
import { callPostgrest } from './postgrest';
import { RemoteError } from './remote-error';

/**
 * Joins the farm a code belongs to, as the signed-in person; returns the
 * farm's id. A wrong, used or expired code is `rejected`. Shared by both
 * apps: a supervisor joins from the phone, HR or a manager from the
 * dashboard.
 */
export async function redeemJoinCode(
  client: SupabaseClient,
  code: string,
): Promise<string> {
  const farmId = await callPostgrest<string | null>(
    client.rpc('redeem_join_code', { join_code: code }),
  );
  if (!farmId) throw new RemoteError('server', 'No farm came back');
  return farmId;
}
