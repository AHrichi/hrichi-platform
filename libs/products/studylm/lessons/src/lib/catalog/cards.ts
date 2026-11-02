import type { BlockKind } from '../spec/blocks';

/**
 * What each block kind is for, written for the model that chooses and
 * fills blocks, and for people reading the catalog. The schema says what
 * a block may contain; the card says when it is the right one.
 */
export interface KindCard {
  label: string;
  purpose: string;
  useWhen: string[];
  avoidWhen: string[];
  rules: string[];
}

export const CATALOG: Record<BlockKind, KindCard> = {
  prose: {
    label: 'Explanation',
    purpose: 'A short written explanation that connects the visuals.',
    useWhen: [
      'introducing an idea before showing it',
      'connecting two visuals',
    ],
    avoidWhen: [
      'a process with steps: use a visual',
      'a list of facts to memorise: use cards',
    ],
    rules: [
      'Two to four short paragraphs at most; the visuals carry the detail.',
      'Concrete before abstract: start from an example the learner knows.',
    ],
  },
  callout: {
    label: 'Callout',
    purpose:
      'One idea set apart: the key idea, an analogy, a pitfall, a tip or a definition.',
    useWhen: [
      'the one thing to remember from a section',
      'a common mistake worth warning about',
    ],
    avoidWhen: ['anything longer than a few sentences'],
    rules: [
      'One idea per callout.',
      'Analogies use everyday things and say where they break down.',
    ],
  },
  compare: {
    label: 'Comparison table',
    purpose: 'Two to four options compared aspect by aspect.',
    useWhen: ['choosing between techniques, data structures or protocols'],
    avoidWhen: ['a single thing described: use prose'],
    rules: [
      'Every row compares the same aspect across all columns.',
      'Cells are short phrases, not sentences.',
    ],
  },
  'code-walkthrough': {
    label: 'Code walkthrough',
    purpose:
      'Code read in steps, highlighting lines and pinning notes, without running it.',
    useWhen: [
      'explaining how a piece of code is structured',
      "code that doesn't run alone (a class, a config, SQL)",
    ],
    avoidWhen: ['showing how values change as code runs: use code-trace'],
    rules: [
      'Real, idiomatic code that would compile.',
      'One idea per step; 3 to 10 steps.',
    ],
  },
  'code-trace': {
    label: 'Code trace',
    purpose:
      'A program run line by line, with variables, the call stack and output after each line.',
    useWhen: [
      'loops, recursion, closures, references: anything where the state matters',
    ],
    avoidWhen: ['long programs: keep the code short and the input small'],
    rules: [
      'For JavaScript use mode "execute" with a short "call": the app runs it and records every frame, so it is always right.',
      'For other languages use "scripted" and write each frame\'s state exactly as the program would have it.',
      'Small inputs: the run should take 5 to 30 frames.',
    ],
  },
  array: {
    label: 'Array',
    purpose:
      'An array changing as an algorithm runs: comparisons, swaps, pointers and the active range.',
    useWhen: ['sorting, searching, two pointers, sliding windows, prefix sums'],
    avoidWhen: ['data without indexes: use stack-queue, hash-table or graph'],
    rules: [
      'Prefer "simulate" when the algorithm is listed: the app computes correct steps from the input.',
      'For scripted steps, declare every pointer name first and narrate the decision at each step.',
      'Keep arrays short (5 to 10 values) so every step is readable.',
    ],
  },
  'stack-queue': {
    label: 'Stack or queue',
    purpose:
      'Items pushed and popped (stack) or enqueued and dequeued (queue) one step at a time.',
    useWhen: [
      'call stacks, undo, bracket matching, BFS frontiers, task scheduling',
    ],
    avoidWhen: ['random access by index: use array'],
    rules: [
      'Only operations the mode allows.',
      'Never remove from an empty structure.',
    ],
  },
  'hash-table': {
    label: 'Hash table',
    purpose:
      'Keys hashed into buckets: inserts, lookups, collisions and resizing.',
    useWhen: ['explaining O(1) lookup, collisions, load factor, resizing'],
    avoidWhen: ['ordered data: use tree'],
    rules: [
      'Use "char-sum-mod" for string keys and "mod" for integer keys, so the app can check every bucket.',
      'Show at least one collision: anagrams collide under char-sum-mod.',
    ],
  },
  tree: {
    label: 'Tree',
    purpose:
      'A tree with its traversals and changes: BSTs, heaps, binary and general trees.',
    useWhen: ['BST search and insert, heaps, traversal orders, hierarchies'],
    avoidWhen: ['graphs with cycles or many parents: use graph'],
    rules: [
      'List nodes parents first; give binary children a side.',
      'A bst keeps the BST order and a heap its heap order; the app checks both.',
      'Prefer "simulate" for the listed algorithms.',
    ],
  },
  graph: {
    label: 'Graph',
    purpose:
      'Nodes and edges with a traversal or shortest-path algorithm running over them.',
    useWhen: [
      'BFS, DFS, Dijkstra, topological sort, dependency graphs, networks',
    ],
    avoidWhen: ["a system's architecture: use flow"],
    rules: [
      'At most 8 to 10 nodes so the layout stays readable.',
      'Prefer "simulate" with a start node; topological sort needs a directed graph without cycles.',
    ],
  },
  grid: {
    label: 'Grid',
    purpose:
      'A grid of cells for path finding, flood fill and dynamic-programming tables.',
    useWhen: ['BFS on a maze, A*, unique paths, minimum path sum, LCS tables'],
    avoidWhen: ['grids larger than 10 by 10'],
    rules: [
      'Rows as strings of ".", "#", "S", "G" or digits.',
      'Prefer "simulate"; lcs builds its own table from "a" and "b".',
    ],
  },
  'recursion-tree': {
    label: 'Recursion tree',
    purpose:
      'Every call a recursive function makes, as a tree, with returns and memo hits.',
    useWhen: [
      'recursion, overlapping subproblems, memoisation, exponential blow-up',
    ],
    avoidWhen: ['loops: use code-trace'],
    rules: [
      'Prefer "simulate" with a small n: fibonacci 4 or 5 shows the repeated work clearly.',
      'Scripted calls follow the call stack: only the innermost open call returns.',
    ],
  },
  flow: {
    label: 'Data flow',
    purpose:
      'Packets of data moving between the parts of a system, step by step.',
    useWhen: [
      'request lifecycles, caching, queues, microservices, pipelines between services',
    ],
    avoidWhen: ['who-talks-to-whom over time with replies: use sequence'],
    rules: [
      'Typed nodes (client, server, database, cache, queue…) and labelled edges.',
      'Every step moves or handles one packet, with a payload preview when the content matters.',
    ],
  },
  sequence: {
    label: 'Sequence diagram',
    purpose:
      'Messages between participants over time: requests, replies and async messages.',
    useWhen: [
      'protocols and handshakes (HTTP, TCP, TLS, OAuth), API call chains',
    ],
    avoidWhen: ['data transformed in place: use pipeline'],
    rules: [
      'Messages in the order they happen; replies use the style "reply".',
      'Show each message once.',
    ],
  },
  'state-machine': {
    label: 'State machine',
    purpose: 'States and the events that move between them, fired one by one.',
    useWhen: ['promises, TCP states, UI states, parsers, protocol states'],
    avoidWhen: ['processes without distinct states'],
    rules: [
      'Exactly one initial state.',
      'Each fire must leave the current state; reject shows an ignored event.',
    ],
  },
  pipeline: {
    label: 'Pipeline',
    purpose: 'Data passing through stages and changing shape at each one.',
    useWhen: [
      'compilers (source, tokens, AST), middleware, ETL, CI/CD, rendering',
    ],
    avoidWhen: ['back-and-forth between systems: use sequence'],
    rules: [
      'Show the data after each stage, so the change is visible.',
      '3 to 6 stages.',
    ],
  },
  'event-loop': {
    label: 'Event loop',
    purpose:
      'The call stack, Web APIs, task queue and microtask queue as JavaScript runs.',
    useWhen: ['setTimeout, promises, async/await ordering, why the UI freezes'],
    avoidWhen: ['synchronous code: use code-trace'],
    rules: [
      'Prefer mode "execute": the app runs the code and records the queues itself.',
      'Scripted steps must follow the loop: microtasks drain before the next task, and tasks run only on an empty stack.',
    ],
  },
  'git-graph': {
    label: 'Git graph',
    purpose: 'Commits, branches and merges growing as git commands run.',
    useWhen: ['branching, merging, rebasing, resetting, tags'],
    avoidWhen: ["anything that isn't version control"],
    rules: [
      'Commit ids are new and unique; merges create a merge commit.',
      'Check out a branch before committing to it.',
    ],
  },
  'concept-map': {
    label: 'Concept map',
    purpose:
      'Ideas and how they relate, revealed step by step or shown at once.',
    useWhen: ['recaps, how the parts of a topic fit together'],
    avoidWhen: ['a process in order: use flow or pipeline'],
    rules: [
      'Every link has a short verb phrase: "points to", "stores", "is a".',
      '5 to 10 concepts.',
    ],
  },
  chart: {
    label: 'Chart',
    purpose: 'A line or bar chart, with growth curves the app computes.',
    useWhen: ['comparing complexities (log n, n, n²), benchmark numbers'],
    avoidWhen: ['data that changes step by step: use a visual'],
    rules: [
      'For complexity, give "fn" and let the app compute the values.',
      'At most 4 series.',
    ],
  },
  predict: {
    label: 'Predict first',
    purpose: 'The learner commits to an answer before a visual shows it.',
    useWhen: ['right before a visual reveals something surprising'],
    avoidWhen: ["questions the lesson hasn't set up yet"],
    rules: [
      'Point "reveal" at the visual (and step) that shows the answer.',
      'Prediction helps even when the guess is wrong: ask about the outcome, not trivia.',
    ],
  },
  quiz: {
    label: 'Quiz question',
    purpose: 'A multiple-choice question; several options may be right.',
    useWhen: ['checking understanding after a section'],
    avoidWhen: ['testing recall of wording'],
    rules: [
      'Distractors come from real misconceptions.',
      'The explanation says why the right answers are right and the others wrong.',
    ],
  },
  'self-explain': {
    label: 'Explain it',
    purpose: 'An open question the learner answers in their own words.',
    useWhen: ['the "why" behind a design or behaviour'],
    avoidWhen: ['questions with one-word answers: use cloze'],
    rules: [
      'Ask why or how, generally ("Why does…?"), not for a specific fact.',
      'The rubric lists the 2 to 4 points a good answer makes.',
    ],
  },
  'order-steps': {
    label: 'Put in order',
    purpose: 'The learner puts the steps of a process in order.',
    useWhen: ['lifecycles, algorithms, protocols, workflows'],
    avoidWhen: ["steps whose order doesn't matter"],
    rules: [
      'Items in the right order; the app shuffles them.',
      '4 to 7 items.',
    ],
  },
  categorize: {
    label: 'Sort into groups',
    purpose: 'The learner sorts items into two to four groups.',
    useWhen: [
      'telling cases apart: base case or recursive case, O(1) or O(n), sync or async',
    ],
    avoidWhen: ['items that fit several groups'],
    rules: [
      'Every item belongs to exactly one group, and every group gets items.',
    ],
  },
  parsons: {
    label: 'Arrange the code',
    purpose:
      'The learner puts shuffled lines of a solution in order, filling in any blanks (faded Parsons).',
    useWhen: ['practising a code pattern before writing it from scratch'],
    avoidWhen: ['code longer than about 12 lines'],
    rules: [
      'Lines in the right order with their indent; the app shuffles them.',
      'Fade one or two key parts into ___ blanks; add at most 3 plausible wrong lines.',
    ],
  },
  'predict-output': {
    label: 'What does it print?',
    purpose: 'The learner predicts the exact output of a short program.',
    useWhen: [
      'ordering surprises (event loop, closures, hoisting), language edge cases',
    ],
    avoidWhen: ['programs whose output is long'],
    rules: [
      'For JavaScript use "execute": the app runs the code to confirm the output.',
      'The output is a few short lines.',
    ],
  },
  cloze: {
    label: 'Fill the gaps',
    purpose: 'A sentence with key terms blanked out for the learner to recall.',
    useWhen: ['terminology, key facts at the end of a section'],
    avoidWhen: ['blanks with many possible answers'],
    rules: ['Blank only the key terms; list accepted variants.'],
  },
};
