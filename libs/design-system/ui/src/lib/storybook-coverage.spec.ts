import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('Storybook coverage guard for @ah/ui', () => {
  const libDir = import.meta.dirname;

  it('guarantees every UI component directory has a corresponding .stories.ts file', () => {
    const entries = readdirSync(libDir);
    const componentDirs = entries.filter((entry) => {
      const fullPath = join(libDir, entry);
      return statSync(fullPath).isDirectory();
    });

    expect(componentDirs.length).toBeGreaterThan(0);

    const missingStories: string[] = [];

    for (const dir of componentDirs) {
      const componentPath = join(libDir, dir);
      const files = readdirSync(componentPath);
      const hasStory = files.some((f) => f.endsWith('.stories.ts'));
      if (!hasStory) {
        missingStories.push(dir);
      }
    }

    expect(
      missingStories,
      `The following components in libs/design-system/ui/src/lib/ are missing a .stories.ts file: ${missingStories.join(', ')}. Every new component MUST be covered in Storybook!`,
    ).toEqual([]);
  });
});
