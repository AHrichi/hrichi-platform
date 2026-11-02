import bfs from './bfs.lesson.json';
import binarySearch from './binary-search.lesson.json';
import eventLoop from './event-loop.lesson.json';
import gitBranching from './git-branching.lesson.json';
import httpRequest from './http-request.lesson.json';
import lookups from './lookups.lesson.json';
import recursion from './recursion.lesson.json';

/**
 * Hand-written lessons that use every block kind. They are the validator's
 * ground truth, the examples in the prompts, and later the offline demo
 * content. Typed as unknown on purpose: they must pass validateLesson.
 */
export const GOLDEN_LESSONS: Readonly<Record<string, unknown>> = {
  'binary-search': binarySearch,
  'http-request': httpRequest,
  'event-loop': eventLoop,
  recursion,
  bfs,
  lookups,
  'git-branching': gitBranching,
};
