import { signalStore, withState } from '@ngrx/signals';
import { initialStudyLmState } from './studylm.state';
import { withStudyLmComputeds } from './studylm.computeds';
import { withStudyLmMethods } from './studylm.methods';
import { withStudyLmHooks } from './studylm.hooks';

export const StudyLmStore = signalStore(
  { providedIn: 'root' },
  withState(initialStudyLmState),
  withStudyLmComputeds(),
  withStudyLmMethods(),
  withStudyLmHooks(),
);

export type StudyLmStore = InstanceType<typeof StudyLmStore>;
