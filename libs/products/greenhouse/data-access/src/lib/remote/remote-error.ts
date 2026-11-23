/**
 * Why a call to the server failed, which decides what the sync does next:
 * - `offline`: no network or no reply; try again later;
 * - `auth`: the session expired; sign in again, then retry;
 * - `rejected`: the server refused the data itself; retrying won't help;
 * - `server`: anything else on the server's side; try again later.
 */
export type RemoteErrorKind = 'offline' | 'auth' | 'rejected' | 'server';

export class RemoteError extends Error {
  override readonly name = 'RemoteError';

  constructor(
    readonly kind: RemoteErrorKind,
    message: string,
  ) {
    super(message);
  }
}
