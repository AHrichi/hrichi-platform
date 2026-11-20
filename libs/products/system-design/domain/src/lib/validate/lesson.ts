import { SceneDraft } from '../engine/scene';
import { wordCount } from '../engine/inline';
import type { LessonMeta } from '../model/course';
import type { Lesson } from '../model/lesson';
import type { SceneNode } from '../model/scene';

/** Limits from the lesson-authoring guide (docs/system-design/lesson-authoring.md §9). */
export const LESSON_LIMITS = {
  idPattern: /^[a-z][a-z0-9-]{0,47}$/,
  metaTitle: 32,
  summary: 110,
  minutes: [5, 15],
  keywords: [3, 10],
  learn: [3, 6],
  learnChars: 60,
  hud: 5,
  steps: [6, 12],
  stepLabel: 14,
  stepTitle: 48,
  bodyParagraphs: [1, 3],
  bodyWords: 80,
  callouts: 2,
  changes: 4,
  ops: 12,
  takeaways: [3, 5],
  checks: [3, 8],
  options: [2, 5],
  tolerance: [0.05, 0.5],
  orderItems: [3, 6],
  cards: [3, 6],
  grid: { width: 14, height: 10 },
} as const;

const L = LESSON_LIMITS;
const within = (n: number, [lo, hi]: readonly [number, number]) =>
  n >= lo && n <= hi;

/**
 * Every problem with a lesson, in plain English; empty means valid. Checks
 * the meta, the text limits, ids, and replays the scene step by step so
 * every reference is checked at the moment its op runs.
 */
export function validateLesson(meta: LessonMeta, lesson: Lesson): string[] {
  const out: string[] = [];
  const bad = (msg: string) => out.push(msg);

  // --- meta -----------------------------------------------------------------
  if (!L.idPattern.test(meta.id)) bad(`meta id "${meta.id}" is not kebab-case`);
  if (meta.id !== lesson.id)
    bad(`meta id "${meta.id}" ≠ lesson id "${lesson.id}"`);
  if (meta.title.length > L.metaTitle)
    bad(`title is over ${L.metaTitle} chars`);
  if (meta.summary.length > L.summary)
    bad(`summary is over ${L.summary} chars`);
  if (!within(meta.minutes, L.minutes))
    bad(`minutes must be ${L.minutes.join('–')}`);
  if (!within(meta.keywords.length, L.keywords))
    bad(`keywords must number ${L.keywords.join('–')}`);

  // --- learn, hud -----------------------------------------------------------
  if (!within(lesson.learn.length, L.learn))
    bad(`learn must have ${L.learn.join('–')} items`);
  lesson.learn.forEach((t, i) => {
    if (t.length > L.learnChars)
      bad(`learn[${i}] is over ${L.learnChars} chars`);
  });
  if (lesson.hud.length > L.hud) bad(`hud has more than ${L.hud} metrics`);

  // --- ids ------------------------------------------------------------------
  const unique = (what: string, ids: readonly string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (!L.idPattern.test(id)) bad(`${what} id "${id}" is not kebab-case`);
      if (seen.has(id)) bad(`${what} id "${id}" is used twice`);
      seen.add(id);
    }
  };
  unique(
    'step',
    lesson.steps.map((s) => s.id),
  );
  unique(
    'check',
    lesson.checks.map((c) => c.id),
  );
  unique(
    'metric',
    lesson.hud.map((m) => m.id),
  );
  const sceneIds = [
    ...lesson.scene.nodes.map((n) => n.id),
    ...lesson.scene.edges.map((e) => e.id),
    ...lesson.scene.zones.map((z) => z.id),
    ...lesson.scene.notes.map((n) => n.id),
    ...lesson.steps.flatMap((s) =>
      s.ops.flatMap((o) =>
        o.op === 'add-node'
          ? [o.node.id]
          : o.op === 'add-edge'
            ? [o.edge.id]
            : o.op === 'add-zone'
              ? [o.zone.id]
              : o.op === 'add-note'
                ? [o.note.id]
                : [],
      ),
    ),
  ];
  for (const id of sceneIds)
    if (!L.idPattern.test(id)) bad(`scene id "${id}" is not kebab-case`);

  // --- steps ----------------------------------------------------------------
  const steps = lesson.steps;
  if (!within(steps.length, L.steps))
    bad(`steps must number ${L.steps.join('–')}`);
  if (steps.length && steps[0].kind !== 'problem')
    bad('the first step must be a problem');
  if (steps.length && steps[steps.length - 1].kind !== 'recap')
    bad('the last step must be a recap');
  steps.forEach((s, i) => {
    const at = `step ${i + 1} ("${s.id}")`;
    if (s.kind === 'recap' && i !== steps.length - 1)
      bad(`${at}: only the last step may be a recap`);
    if (!s.label.trim() || s.label.length > L.stepLabel)
      bad(`${at}: label must be 1–${L.stepLabel} chars`);
    if (!s.title.trim() || s.title.length > L.stepTitle)
      bad(`${at}: title must be 1–${L.stepTitle} chars`);
    if (!within(s.body.length, L.bodyParagraphs))
      bad(`${at}: body must have ${L.bodyParagraphs.join('–')} paragraphs`);
    const words = s.body.reduce((n, p) => n + wordCount(p), 0);
    if (words > L.bodyWords)
      bad(`${at}: body has ${words} words, over ${L.bodyWords}`);
    if ((s.callouts?.length ?? 0) > L.callouts)
      bad(`${at}: more than ${L.callouts} callouts`);
    if ((s.changes?.length ?? 0) > L.changes)
      bad(`${at}: more than ${L.changes} changes`);
    if (s.ops.length > L.ops) bad(`${at}: more than ${L.ops} ops`);
    for (const li of s.learns ?? [])
      if (!Number.isInteger(li) || li < 0 || li >= lesson.learn.length)
        bad(`${at}: learns index ${li} is out of range`);
    if (s.kind === 'recap') {
      if (!within(s.takeaways?.length ?? 0, L.takeaways))
        bad(`${at}: a recap needs ${L.takeaways.join('–')} takeaways`);
    } else if (s.takeaways?.length) bad(`${at}: only the recap has takeaways`);
  });
  const ticked = new Set(steps.flatMap((s) => s.learns ?? []));
  lesson.learn.forEach((_, i) => {
    if (!ticked.has(i)) bad(`learn[${i}] is never ticked by a step`);
  });

  // --- the scene, replayed --------------------------------------------------
  const draft = new SceneDraft(lesson);
  const placement = (when: string) => {
    const cells = new Map<string, string>();
    for (const n of draft.nodes.values()) {
      const key = `${n.at.x},${n.at.y}`;
      const other = cells.get(key);
      if (other)
        bad(`${when}: nodes "${other}" and "${n.id}" share cell ${key}`);
      cells.set(key, n.id);
      if (!onGrid(n))
        bad(
          `${when}: node "${n.id}" is outside the ${L.grid.width}×${L.grid.height} grid`,
        );
    }
  };
  placement('baseline');
  for (const n of lesson.scene.notes) {
    const a = n.anchor;
    if ('node' in a && !draft.nodes.has(a.node))
      bad(`baseline: note "${n.id}" is anchored to unknown node "${a.node}"`);
    if ('edge' in a && !draft.edges.has(a.edge))
      bad(`baseline: note "${n.id}" is anchored to unknown edge "${a.edge}"`);
  }
  for (const e of lesson.scene.edges) {
    if (!draft.nodes.has(e.from) || !draft.nodes.has(e.to))
      bad(`baseline: edge "${e.id}" joins an unknown node`);
  }
  steps.forEach((s, i) => {
    const at = `step ${i + 1} ("${s.id}")`;
    for (const op of s.ops) {
      const problem = draft.apply(op, true);
      if (problem) bad(`${at}: ${problem}`);
    }
    placement(at);
  });

  // --- checks ---------------------------------------------------------------
  if (!within(lesson.checks.length, L.checks))
    bad(`checks must number ${L.checks.join('–')}`);
  const stepIds = new Set(steps.map((s) => s.id));
  for (const c of lesson.checks) {
    const at = `check "${c.id}"`;
    if (!c.prompt.trim() || !c.explain.trim())
      bad(`${at}: needs a prompt and an explanation`);
    if (c.step && !stepIds.has(c.step)) bad(`${at}: unknown step "${c.step}"`);
    if (c.kind === 'choice') {
      if (!within(c.options.length, L.options))
        bad(`${at}: needs ${L.options.join('–')} options`);
      if (new Set(c.options).size !== c.options.length)
        bad(`${at}: options must be distinct`);
      if (
        !Number.isInteger(c.answer) ||
        c.answer < 0 ||
        c.answer >= c.options.length
      )
        bad(`${at}: answer is out of range`);
    } else if (c.kind === 'numeric') {
      if (!Number.isFinite(c.answer)) bad(`${at}: answer must be a number`);
      if (!within(c.tolerance, L.tolerance))
        bad(`${at}: tolerance must be ${L.tolerance.join('–')}`);
    } else {
      if (!within(c.items.length, L.orderItems))
        bad(`${at}: needs ${L.orderItems.join('–')} items`);
      if (new Set(c.items).size !== c.items.length)
        bad(`${at}: items must be distinct`);
    }
  }

  // --- cards ----------------------------------------------------------------
  if (!within(lesson.cards.length, L.cards))
    bad(`cards must number ${L.cards.join('–')}`);
  lesson.cards.forEach((c, i) => {
    if (!c.front.trim() || !c.back.trim())
      bad(`card ${i + 1} needs a front and a back`);
  });

  return out;
}

function onGrid(n: SceneNode): boolean {
  return (
    n.at.x >= 0 &&
    n.at.y >= 0 &&
    n.at.x <= L.grid.width - 1 &&
    n.at.y <= L.grid.height - 1
  );
}
