import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { FederationStore } from '@ah/platform/federation';
import {
  type BuildInfo,
  compareShared,
  describeBuild,
  formatVital,
  type RemoteEntryFile,
  type Vital,
  type VitalName,
} from './inspector-data';

/** Read-only state the panel shows, keyed by store name. */
export type InspectableStores = Record<string, () => unknown>;

type Tab = 'remotes' | 'shared' | 'state' | 'vitals';

const tabs: { id: Tab; label: string }[] = [
  { id: 'remotes', label: 'Remotes' },
  { id: 'shared', label: 'Shared deps' },
  { id: 'state', label: 'State' },
  { id: 'vitals', label: 'Web Vitals' },
];

const vitalOrder: VitalName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Settles every request; a remote that is down shows as missing, not as an error. */
async function settle<T>(
  entries: [string, string][],
  signal: AbortSignal,
): Promise<Record<string, T | null>> {
  const results = await Promise.allSettled(
    entries.map(([, url]) => fetchJson<T>(url, signal)),
  );
  return Object.fromEntries(
    entries.map(([name], i) => {
      const result = results[i];
      return [name, result.status === 'fulfilled' ? result.value : null];
    }),
  );
}

/**
 * "Open the hood" (ADR-0012): which remotes this page loaded and how fast,
 * the build each one runs, shared-dependency skew, live store state and
 * Web Vitals. Loaded lazily, so it costs nothing until opened.
 */
@Component({
  selector: 'ah-inspector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'closed.emit()' },
  templateUrl: './inspector.html',
  styleUrl: './inspector.scss',
})
export class Inspector {
  readonly stores = input<InspectableStores>({});
  readonly closed = output<void>();

  protected readonly tabs = tabs;
  protected readonly tab = signal<Tab>('remotes');
  private readonly federation = inject(FederationStore);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  /** Remote name → remoteEntry.json URL, as the shell booted with. */
  private readonly manifest = resource({
    loader: ({ abortSignal }) =>
      fetchJson<Record<string, string>>(
        'federation.manifest.json',
        abortSignal,
      ),
  });

  private readonly builds = resource({
    params: () => this.manifest.value(),
    loader: ({ params, abortSignal }) =>
      settle<BuildInfo>(
        [
          ['shell', 'build-info.json'],
          ...Object.entries(params).map(([name, entry]): [string, string] => [
            name,
            new URL('build-info.json', entry).href,
          ]),
        ],
        abortSignal,
      ),
  });

  private readonly entries = resource({
    params: () => this.manifest.value(),
    loader: ({ params, abortSignal }) =>
      settle<RemoteEntryFile>(
        [['shell', 'remoteEntry.json'], ...Object.entries(params)],
        abortSignal,
      ),
  });

  protected readonly remotes = computed(() => {
    const manifest = this.manifest.value() ?? {};
    const builds = this.builds.value() ?? {};
    const loads = this.federation.entityMap();
    return Object.entries(manifest).map(([name, entry]) => {
      const load = loads[name];
      const build = builds[name];
      return {
        name,
        entry,
        status: load?.status ?? 'not loaded',
        failure:
          load?.failure?.kind === 'capability'
            ? `needs ${load.failure.missing.join(', ')}`
            : load?.failure?.kind,
        duration:
          load?.durationMs == null ? '—' : `${Math.round(load.durationMs)} ms`,
        version: load?.meta?.version ?? '—',
        capabilities: load?.meta?.capabilities.join(', ') || '—',
        build: build ? describeBuild(build) : '—',
      };
    });
  });

  protected readonly shellBuild = computed(() => {
    const build = this.builds.value()?.['shell'];
    return build ? describeBuild(build) : 'local build';
  });

  protected readonly shared = computed(() => {
    const entries = this.entries.value();
    const shell = entries?.['shell'];
    if (!shell) {
      return null;
    }
    const remotes = Object.entries(entries)
      .filter(
        (pair): pair is [string, RemoteEntryFile] =>
          pair[0] !== 'shell' && pair[1] !== null,
      )
      .map(([, file]) => file);
    return {
      remotes: remotes.map((r) => r.name),
      rows: compareShared(shell, remotes),
    };
  });

  protected readonly state = computed(() =>
    Object.entries(this.stores()).map(([name, read]) => ({
      name,
      json: JSON.stringify(read(), null, 2),
    })),
  );

  private readonly vitalsByName = signal<Partial<Record<VitalName, Vital>>>({});
  protected readonly vitals = computed(() =>
    vitalOrder.map((name) => {
      const vital = this.vitalsByName()[name];
      return {
        name,
        value: vital ? formatVital(vital) : 'waiting…',
        rating: vital?.rating ?? null,
      };
    }),
  );

  constructor() {
    afterNextRender(() => {
      this.heading()?.nativeElement.focus();
      void this.watchVitals();
    });
  }

  protected select(tab: Tab, focus = false, event?: Event): void {
    this.tab.set(tab);
    if (focus) {
      event?.preventDefault();
      const host = (event?.target as HTMLElement | undefined)?.parentElement;
      host?.querySelector<HTMLElement>(`#inspector-tab-${tab}`)?.focus();
    }
  }

  /** Arrow keys move between tabs, as in the WAI-ARIA tabs pattern. */
  protected step(offset: number, event: Event): void {
    const index = tabs.findIndex((t) => t.id === this.tab());
    const next = tabs[(index + offset + tabs.length) % tabs.length];
    this.select(next.id, true, event);
  }

  private async watchVitals(): Promise<void> {
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');
    const report = ({ name, value, rating }: Vital) =>
      this.vitalsByName.update((all) => ({
        ...all,
        [name]: { name, value, rating },
      }));
    for (const watch of [onCLS, onFCP, onINP, onLCP, onTTFB]) {
      watch(report, { reportAllChanges: true });
    }
  }
}
