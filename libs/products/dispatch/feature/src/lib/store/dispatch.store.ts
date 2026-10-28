import { signalStore, withState } from '@ngrx/signals';
import { initialDispatchState } from './dispatch.state';
import { withDispatchComputeds } from './dispatch.computeds';
import { withDispatchMethods } from './dispatch.methods';
import { withDispatchHooks } from './dispatch.hooks';

export const DispatchStore = signalStore(
  { providedIn: 'root' },
  withState(initialDispatchState),
  withDispatchComputeds(),
  withDispatchMethods(),
  withDispatchHooks(),
);

export type DispatchStore = InstanceType<typeof DispatchStore>;
