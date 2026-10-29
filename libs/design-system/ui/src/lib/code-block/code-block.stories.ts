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

const RXJS_CODE = `import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export class UserService {
  constructor(private http: HttpClient) {}

  fetchUser(id: number): Observable<User> {
    return this.http.get<User>(\`/api/users/\${id}\`).pipe(
      map(user => ({ ...user, active: true })),
      catchError(err => {
        console.error('Request failed:', err);
        throw err;
      })
    );
  }
}`;

/**
 * Token-styled code snippet viewer with syntax highlighting, line numbers,
 * interactive line wrapping, language badges, and one-click clipboard copy.
 */
const meta: Meta<CodeBlock> = {
  title: 'Display/CodeBlock',
  component: CodeBlock,
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 680px; padding: 1.5rem;">
        <ah-code-block
          [code]="code"
          [language]="language"
          [filename]="filename"
          [caption]="caption"
          [allowCopy]="allowCopy"
          [showLineNumbers]="showLineNumbers"
          [wrapLines]="wrapLines"
        />
      </div>
    `,
  }),
  args: {
    code: SAMPLE_CODE,
    language: 'typescript',
    filename: 'closure-example.ts',
    caption: 'Pure closure encapsulation pattern with private state',
    allowCopy: true,
    showLineNumbers: true,
    wrapLines: false,
  },
};
export default meta;

export const Default: StoryObj<CodeBlock> = {};

export const AngularRxjs: StoryObj<CodeBlock> = {
  args: {
    language: 'typescript',
    filename: 'user.service.ts',
    code: RXJS_CODE,
    caption: 'Cold observable emission scheduled asynchronously on microtask queue',
  },
};

export const JsonSnippet: StoryObj<CodeBlock> = {
  args: {
    language: 'json',
    filename: 'section-schema.json',
    caption: 'StudyLM domain entity schema',
    code: `{\n  "section": "1.1",\n  "tier": "beginner",\n  "status": "approved",\n  "cardCount": 12,\n  "quizCount": 5\n}`,
  },
};
