# shared-steps

Helpers for stepped lessons whose steps each carry a list of ops. `upTo(steps, n, apply)` replays the ops of steps 0 to `n` in order and flags the ops of step `n` itself as `current`, so a visual can rebuild its state for any step without keeping history. `OpStep<TOp>` is the one shape it needs: `{ readonly ops: readonly TOp[] }`.

Promoted from StudyLM's lessons lib so the System Design course can use it too. It is `type:util` and `runtime:agnostic`, so domain libs, browser apps and Nest can all import it from `@ah/shared/steps`.

Run `nx test shared-steps` for its tests.
