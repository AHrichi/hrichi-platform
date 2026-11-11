import { existsSync, readFileSync, writeFileSync } from 'node:fs';

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

/**
 * Sets KEY=value lines in a .env file: replaces the keys it has, appends
 * the others, and keeps every other line (comments included) as it was.
 */
export function writeEnvValues(values, path = secretsFile) {
  const lines = existsSync(path)
    ? readFileSync(path, 'utf8')
        .replace(/\r?\n$/, '')
        .split(/\r?\n/)
    : [];
  const pending = new Map(Object.entries(values));
  const updated = lines.map((line) => {
    const key = line.match(/^([A-Z0-9_]+)=/)?.[1];
    if (!key || !pending.has(key)) return line;
    const value = pending.get(key);
    pending.delete(key);
    return `${key}=${value}`;
  });
  for (const [key, value] of pending) updated.push(`${key}=${value}`);
  writeFileSync(path, `${updated.join('\n')}\n`);
}
