import { existsSync, readFileSync } from 'node:fs';

/** Where tools/scripts/lead-secrets.mjs keeps the lead pipeline's secrets. */
export const secretsFile = '.env.render';

/** KEY=value lines of a .env file; comments and blank lines are skipped. */
export function readEnvFile(path = secretsFile) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const at = line.indexOf('=');
        return [line.slice(0, at), line.slice(at + 1)];
      }),
  );
}
