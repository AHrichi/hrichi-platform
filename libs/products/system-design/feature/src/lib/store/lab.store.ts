import { computed, DestroyRef, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addNode,
  type ChallengeCheck,
  checkChallenge,
  cloneDesign,
  connect,
  connectableTargets,
  disconnect,
  findChallenge,
  LAB_CHALLENGES,
  type LabDesign,
  type LabKind,
  labNodeLabel,
  labScene,
  MAX_RPS,
  MIN_RPS,
  removeNode,
  simulate,
  type Traffic,
  updateNode,
} from '@ah/products/system-design/domain';
import { SystemDesignRuntime } from './system-design-runtime';

/** The route id of the free sandbox. */
export const SANDBOX_ID = 'free';
/** Debounce for writing the design to IndexedDB. */
export const LAB_SAVE_DEBOUNCE_MS = 400;

export const SANDBOX_TRAFFIC: Traffic = {
  rps: 800,
  readRatio: 0.8,
  staticRatio: 0,
};
/** The sandbox starts from the first challenge's starter (one server, one database). */
export const SANDBOX_STARTER: LabDesign = LAB_CHALLENGES[0].starter;

export type ChallengeStatus = 'new' | 'started' | 'solved';

export interface LabLinkView {
  from: string;
  to: string;
  /** The other end, as shown. */
  other: string;
  direction: 'to' | 'from';
}

export interface LabState {
  challengeId: string | null;
  design: LabDesign;
  traffic: Traffic;
  selectedId: string | null;
  ready: boolean;
}

const initialState: LabState = {
  challengeId: null,
  design: cloneDesign(SANDBOX_STARTER),
  traffic: SANDBOX_TRAFFIC,
  selectedId: null,
  ready: false,
};

/** Keeps traffic within the controls' ranges. */
export function clampTraffic(t: Traffic): Traffic {
  const unit = (x: number) => Math.min(1, Math.max(0, x));
  return {
    rps: Math.min(MAX_RPS, Math.max(MIN_RPS, Math.round(t.rps))),
    readRatio: unit(t.readRatio),
    staticRatio: unit(t.staticRatio),
  };
}

/** Whether a saved design meets every goal of its challenge. */
export function statusOf(
  challengeId: string,
  saved: LabDesign | undefined,
): ChallengeStatus {
  const challenge = findChallenge(challengeId);
  if (!challenge || !saved) return 'new';
  return checkChallenge(challenge, saved).solved ? 'solved' : 'started';
}

/**
 * The Design Lab's state for one open challenge or the sandbox. Provided by
 * `LabScreen`, so each visit starts clean. Every edit re-simulates through
 * computeds and autosaves to the `designs` table, debounced.
 */
export const LabStore = signalStore(
  withState(initialState),
  withComputed(({ challengeId, design, traffic, selectedId }) => {
    const challenge = computed(() => {
      const id = challengeId();
      return id && id !== SANDBOX_ID ? (findChallenge(id) ?? null) : null;
    });
    const isSandbox = computed(() => challengeId() === SANDBOX_ID);
    /** Challenges judge at their own traffic; the sandbox at the controls'. */
    const effectiveTraffic = computed(() => challenge()?.traffic ?? traffic());
    const check = computed<ChallengeCheck | null>(() => {
      const c = challenge();
      return c ? checkChallenge(c, design(), c.traffic) : null;
    });
    const result = computed(
      () => check()?.result ?? simulate(design(), effectiveTraffic()),
    );
    const selectedNode = computed(
      () => design().nodes.find((n) => n.id === selectedId()) ?? null,
    );
    const label = (id: string) => {
      const n = design().nodes.find((x) => x.id === id);
      return n ? labNodeLabel(design(), n) : id;
    };
    return {
      challenge,
      isSandbox,
      effectiveTraffic,
      check,
      result,
      scene: computed(() => labScene(design(), result())),
      selectedNode,
      selectedLabel: computed(() => {
        const n = selectedNode();
        return n ? labNodeLabel(design(), n) : '';
      }),
      selectedResult: computed(
        () => result().nodes.find((n) => n.id === selectedId()) ?? null,
      ),
      connectTargets: computed(() => {
        const n = selectedNode();
        if (!n) return [];
        return connectableTargets(design(), n.id).map((t) => ({
          id: t.id,
          label: label(t.id),
        }));
      }),
      selectedLinks: computed<LabLinkView[]>(() => {
        const id = selectedId();
        if (!id) return [];
        return design()
          .links.filter((l) => l.from === id || l.to === id)
          .map((l) =>
            l.from === id
              ? { ...l, other: label(l.to), direction: 'to' as const }
              : { ...l, other: label(l.from), direction: 'from' as const },
          );
      }),
    };
  }),
  withMethods((store) => {
    const runtime = inject(SystemDesignRuntime);
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let openToken = 0;

    async function save(): Promise<void> {
      const id = store.challengeId();
      if (!id || !store.ready()) return;
      try {
        const local = await runtime.open();
        await local?.putDesign({
          id,
          design: store.design(),
          ...(id === SANDBOX_ID ? { traffic: store.traffic() } : {}),
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Keep working in memory when storage is unavailable.
      }
    }

    function scheduleSave(): void {
      if (saveTimer !== null) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = null;
        void save();
      }, LAB_SAVE_DEBOUNCE_MS);
    }

    function commit(design: LabDesign, selectedId = store.selectedId()): void {
      const keep = design.nodes.some((n) => n.id === selectedId);
      patchState(store, { design, selectedId: keep ? selectedId : null });
      scheduleSave();
    }

    inject(DestroyRef, { optional: true })?.onDestroy(() => {
      if (saveTimer !== null) {
        clearTimeout(saveTimer);
        saveTimer = null;
        void save();
      }
    });

    return {
      /** Loads the saved design for a challenge (or the sandbox), else its starter. */
      async open(challengeId: string): Promise<void> {
        const token = ++openToken;
        if (saveTimer !== null) {
          clearTimeout(saveTimer);
          saveTimer = null;
          await save();
        }
        const challenge = findChallenge(challengeId);
        const starter =
          challengeId === SANDBOX_ID ? SANDBOX_STARTER : challenge?.starter;
        patchState(store, {
          challengeId,
          ready: false,
          selectedId: null,
          design: cloneDesign(starter ?? SANDBOX_STARTER),
          traffic: SANDBOX_TRAFFIC,
        });
        let row;
        try {
          row = await (await runtime.open())?.getDesign(challengeId);
        } catch {
          row = undefined;
        }
        if (token !== openToken) return;
        patchState(store, {
          ready: true,
          ...(row ? { design: row.design } : {}),
          ...(row?.traffic ? { traffic: clampTraffic(row.traffic) } : {}),
        });
      },

      /** Writes any pending change now (tests, and before leaving). */
      async flush(): Promise<void> {
        if (saveTimer !== null) {
          clearTimeout(saveTimer);
          saveTimer = null;
        }
        await save();
      },

      select(id: string | null): void {
        patchState(store, { selectedId: id });
      },

      add(kind: LabKind): string {
        const { design, id } = addNode(store.design(), kind);
        if (id) commit(design, id);
        return id;
      },

      setInstances(instances: number): void {
        const id = store.selectedId();
        if (id) commit(updateNode(store.design(), id, { instances }));
      },

      setHitRatio(hitRatio: number): void {
        const id = store.selectedId();
        if (id) commit(updateNode(store.design(), id, { hitRatio }));
      },

      setDown(down: boolean): void {
        const id = store.selectedId();
        if (id) commit(updateNode(store.design(), id, { down }));
      },

      connectTo(to: string): void {
        const id = store.selectedId();
        if (id) commit(connect(store.design(), id, to));
      },

      unlink(from: string, to: string): void {
        commit(disconnect(store.design(), from, to));
      },

      removeSelected(): void {
        const id = store.selectedId();
        if (id) commit(removeNode(store.design(), id), null);
      },

      setTraffic(patch: Partial<Traffic>): void {
        if (!store.isSandbox()) return;
        patchState(store, {
          traffic: clampTraffic({ ...store.traffic(), ...patch }),
        });
        scheduleSave();
      },

      reset(): void {
        const starter = store.challenge()?.starter ?? SANDBOX_STARTER;
        if (store.isSandbox()) patchState(store, { traffic: SANDBOX_TRAFFIC });
        commit(cloneDesign(starter), null);
      },
    };
  }),
);
