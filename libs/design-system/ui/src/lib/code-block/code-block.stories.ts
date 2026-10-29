import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { CodeBlock } from './code-block';

const SAMPLE_CODE = `function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    getValue: () => count
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1`;

/**
 * Token-styled code snippet viewer with copy support and metadata headers.
 */
const meta: Meta<CodeBlock> = {
  title: 'Display/CodeBlock',
  component: CodeBlock,
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 640px; padding: 1.5rem;">
        <ah-code-block
          [code]="code"
          [language]="language"
          [filename]="filename"
          [allowCopy]="allowCopy"
        />
      </div>
    `,
  }),
  args: {
    code: SAMPLE_CODE,
    language: 'typescript',
    filename: 'closure-example.ts',
    allowCopy: true,
  },
};
export default meta;

export const Default: StoryObj<CodeBlock> = {};

export const JsonSnippet: StoryObj<CodeBlock> = {
  args: {
    language: 'json',
    filename: 'section-schema.json',
    code: `{\n  "section": "1.1",\n  "tier": "beginner",\n  "status": "approved"\n}`,
  },
};
