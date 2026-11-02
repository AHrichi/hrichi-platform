import { BLOCK_KINDS } from '../spec/blocks';
import { LessonSchema } from '../spec/lesson';
import { validateBlock } from '../validate/validate';
import { buildLessonKit, catalogMarkdown } from './lesson-kit';
import { strictJsonSchema, strictnessProblems } from './strict-schema';

/**
 * The generated files are Vitest file snapshots: CI fails when they drift
 * from the code. Rewrite them with `pnpm nx test product-studylm-lessons -u`,
 * then regenerate the n8n workflow (tools/scripts/update-studylm-workflow.mjs).
 */
describe('Lesson kit', () => {
  const kit = buildLessonKit();

  it.each(BLOCK_KINDS)(
    'gives "%s" a card, a strict schema and a valid example',
    (kind) => {
      const entry = kit.block.kinds[kind];
      expect(entry.card).toContain(`Kind "${kind}"`);
      expect(strictnessProblems(entry.schema)).toEqual([]);
      const example = validateBlock(entry.example, kind);
      expect(example.ok ? example.warnings : example.issues).toEqual([]);
    },
  );

  it('keeps the outline and feedback schemas strict', () => {
    expect(strictnessProblems(kit.outline.schema)).toEqual([]);
    expect(strictnessProblems(kit.feedback.schema)).toEqual([]);
  });

  it('lists every kind in the outline prompt and fences user text as data', () => {
    for (const kind of BLOCK_KINDS) {
      expect(kit.outline.system).toContain(`- ${kind}: `);
    }
    for (const system of [
      kit.outline.system,
      kit.block.system,
      kit.repair.system,
      kit.feedback.system,
    ]) {
      expect(system).toContain('<data>');
    }
  });

  it('stays small enough to embed in the workflow', () => {
    expect(JSON.stringify(kit).length).toBeLessThan(250_000);
  });

  it('is written to generated/lesson-kit.json', async () => {
    await expect(`${JSON.stringify(kit, null, 2)}\n`).toMatchFileSnapshot(
      '../../generated/lesson-kit.json',
    );
  });

  it('writes the whole lesson schema and the catalog for reference', async () => {
    await expect(
      `${JSON.stringify(strictJsonSchema(LessonSchema), null, 2)}\n`,
    ).toMatchFileSnapshot('../../generated/lesson.schema.json');
    await expect(
      `# Block catalog\n\n${catalogMarkdown()}\n`,
    ).toMatchFileSnapshot('../../generated/catalog.md');
  });
});
