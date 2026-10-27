/** One shared package as Native Federation lists it in `remoteEntry.json`. */
export interface SharedEntry {
  packageName: string;
  version?: string;
  singleton?: boolean;
}

export interface RemoteEntryFile {
  name: string;
  shared: SharedEntry[];
}

/** Written next to every deployed app by tools/scripts/prepare-hosting.mjs. */
export interface BuildInfo {
  app: string;
  sha: string;
  builtAt: string;
}

export interface SharedRow {
  packageName: string;
  shell: string | null;
  /** Version per remote, `null` when that remote doesn't share the package. */
  versions: Record<string, string | null>;
  /** A remote was built against a different version than the shell. */
  skew: boolean;
}

/**
 * Lines up the shared packages of the shell and its remotes. With
 * `strictVersion` singletons the shell's copy wins at runtime, so any other
 * version means a remote runs against code it wasn't built with.
 */
export function compareShared(
  shell: RemoteEntryFile,
  remotes: RemoteEntryFile[],
): SharedRow[] {
  const versionIn = (file: RemoteEntryFile, packageName: string) =>
    file.shared.find((entry) => entry.packageName === packageName)?.version ??
    null;
  const names = new Set(
    [shell, ...remotes].flatMap((file) =>
      file.shared.map((entry) => entry.packageName),
    ),
  );
  return [...names].sort().map((packageName) => {
    const shellVersion = versionIn(shell, packageName);
    const versions = Object.fromEntries(
      remotes.map((remote) => [remote.name, versionIn(remote, packageName)]),
    );
    return {
      packageName,
      shell: shellVersion,
      versions,
      skew: Object.values(versions).some(
        (version) =>
          version !== null && shellVersion !== null && version !== shellVersion,
      ),
    };
  });
}

/** `a4edb97 · 27 Oct, 09:12` */
export function describeBuild(info: BuildInfo, locale = 'en-GB'): string {
  const when = new Date(info.builtAt).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${info.sha.slice(0, 7)} · ${when}`;
}

export type VitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

export interface Vital {
  name: VitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function formatVital({ name, value }: Vital): string {
  return name === 'CLS' ? value.toFixed(3) : `${Math.round(value)} ms`;
}
