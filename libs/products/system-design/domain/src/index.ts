// The System Design domain (ADR-0025). Lesson files are never exported from
// here: they load through `LessonMeta.load()`, one lazy chunk each.
export * from './lib/app';

export * from './lib/model/course';
export * from './lib/model/lesson';
export * from './lib/model/scene';
export * from './lib/model/checks';
export * from './lib/model/cheatsheet';
export * from './lib/model/icons';
export * from './lib/model/node-kinds';

export * from './lib/engine/fold';
export * from './lib/engine/scene';
export * from './lib/engine/iso';
export * from './lib/engine/inline';
export * from './lib/engine/checks';
export * from './lib/engine/progress';
export * from './lib/engine/search';
export * from './lib/engine/practice';

export * from './lib/validate/lesson';

export * from './lib/lab/model';
export * from './lib/lab/simulate';
export * from './lib/lab/challenge';
export * from './lib/lab/edit';
export * from './lib/lab/scene';
export * from './lib/content/lab/catalog';
export {
  chain,
  findChallenge,
  LAB_CHALLENGES,
  labNode,
} from './lib/content/lab/challenges';

export { ALL_LESSONS, CURRICULUM, findLesson } from './lib/content/curriculum';
export {
  CHEATSHEETS,
  CHEAT_TERMS,
  type CheatsheetMeta,
  cheatTermsFrom,
  findCheatsheet,
} from './lib/content/cheatsheets';
