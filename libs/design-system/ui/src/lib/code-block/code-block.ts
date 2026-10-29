import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type CodeTokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'type'
  | 'function'
  | 'boolean'
  | 'operator'
  | 'plain';

export interface CodeToken {
  readonly type: CodeTokenType;
  readonly text: string;
}

export interface CodeLine {
  readonly lineNumber: number;
  readonly tokens: readonly CodeToken[];
}

const KEYWORDS = new Set([
  'abstract', 'any', 'as', 'async', 'await', 'break', 'case', 'catch', 'class',
  'const', 'continue', 'debugger', 'declare', 'default', 'delete', 'do',
  'else', 'enum', 'export', 'extends', 'finally', 'for', 'from', 'function',
  'get', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'is',
  'keyof', 'let', 'module', 'namespace', 'never', 'new', 'of', 'package',
  'private', 'protected', 'public', 'readonly', 'require', 'return', 'set',
  'static', 'super', 'switch', 'symbol', 'this', 'throw', 'try', 'type',
  'typeof', 'unknown', 'var', 'void', 'while', 'with', 'yield',
  // Python / Rust / Go / SQL
  'def', 'elif', 'except', 'pass', 'raise', 'lambda', 'fn', 'mut', 'pub',
  'match', 'select', 'where', 'insert', 'update', 'delete', 'struct'
]);

const BUILTIN_TYPES = new Set([
  'string', 'number', 'boolean', 'symbol', 'bigint', 'object', 'undefined',
  'null', 'void', 'any', 'never', 'unknown',
  'Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Record', 'Promise',
  'Observable', 'Subject', 'BehaviorSubject', 'ReplaySubject',
  'HttpClient', 'HttpHeaders', 'HttpParams', 'HttpResponse', 'HttpErrorResponse',
  'Signal', 'WritableSignal', 'Component', 'Injectable', 'Directive', 'Pipe',
  'Console', 'Math', 'JSON', 'Date', 'RegExp', 'Error',
  'int', 'str', 'float', 'list', 'dict', 'tuple', 'bool'
]);

const BOOLEANS_NIL = new Set([
  'true', 'false', 'null', 'undefined', 'nil', 'None', 'True', 'False',
]);

function tokenizeLine(line: string, language: string): CodeToken[] {
  if (!line || line.length === 0) {
    return [{ type: 'plain', text: ' ' }];
  }

  const tokens: CodeToken[] = [];
  let i = 0;
  const isPythonOrShell = ['python', 'py', 'sh', 'bash', 'shell'].includes(
    language.toLowerCase()
  );

  while (i < line.length) {
    // 1. Single-line comment
    if (
      line.startsWith('//', i) ||
      (isPythonOrShell && line[i] === '#')
    ) {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    // 2. Multi-line comment start (on single line)
    if (line.startsWith('/*', i)) {
      const endIdx = line.indexOf('*/', i + 2);
      if (endIdx !== -1) {
        tokens.push({ type: 'comment', text: line.slice(i, endIdx + 2) });
        i = endIdx + 2;
        continue;
      } else {
        tokens.push({ type: 'comment', text: line.slice(i) });
        break;
      }
    }

    // 3. String literals (double, single, backtick)
    const char = line[i];
    if (char === '"' || char === "'" || char === '`') {
      let str = char;
      i++;
      let escaped = false;
      while (i < line.length) {
        const nextChar = line[i];
        str += nextChar;
        if (escaped) {
          escaped = false;
        } else if (nextChar === '\\') {
          escaped = true;
        } else if (nextChar === char) {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', text: str });
      continue;
    }

    // 4. Numbers
    if (/\d/.test(char) && (i === 0 || !/[a-zA-Z0-9_$]/.test(line[i - 1]))) {
      let num = '';
      while (i < line.length && /[0-9.xXa-fA-F_]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ type: 'number', text: num });
      continue;
    }

    // 5. Word / Identifiers / Keywords / Types / Functions
    if (/[a-zA-Z_$]/.test(char)) {
      let word = '';
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i];
        i++;
      }

      // Look ahead to check if function call
      let j = i;
      while (j < line.length && (line[j] === ' ' || line[j] === '\t')) {
        j++;
      }
      const isCall = j < line.length && line[j] === '(';

      if (isCall && !KEYWORDS.has(word)) {
        tokens.push({ type: 'function', text: word });
      } else if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (BOOLEANS_NIL.has(word)) {
        tokens.push({ type: 'boolean', text: word });
      } else if (BUILTIN_TYPES.has(word)) {
        tokens.push({ type: 'type', text: word });
      } else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(word)) {
        tokens.push({ type: 'type', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      continue;
    }

    // 6. Compound Operators
    const threeChars = line.slice(i, i + 3);
    if (['===', '!==', '>>>', '<<='].includes(threeChars)) {
      tokens.push({ type: 'operator', text: threeChars });
      i += 3;
      continue;
    }

    const twoChars = line.slice(i, i + 2);
    if (
      [
        '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '++', '--',
        '+=', '-=', '*=', '/=', '?.',
      ].includes(twoChars)
    ) {
      tokens.push({ type: 'operator', text: twoChars });
      i += 2;
      continue;
    }

    // 7. Single Operators & Punctuation
    if (/[=<>!&|+\-*%^~?:;.,()[\]{}]/.test(char)) {
      tokens.push({ type: 'operator', text: char });
      i++;
      continue;
    }

    // 8. Whitespace & default characters
    let plain = char;
    i++;
    while (
      i < line.length &&
      !/[a-zA-Z0-9_$"'/`#]/.test(line[i]) &&
      !line.startsWith('//', i) &&
      !line.startsWith('/*', i) &&
      !/[=<>!&|+\-*%^~?:;.,()[\]{}]/.test(line[i])
    ) {
      plain += line[i];
      i++;
    }
    tokens.push({ type: 'plain', text: plain });
  }

  return tokens;
}

/**
 * Token-styled code snippet viewer with syntax highlighting, line numbers,
 * interactive line wrapping, language badges, and one-click clipboard copy.
 */
@Component({
  selector: 'ah-code-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-code-block',
    '[class.ah-code-block--wrapped]': 'wrapLines()',
  },
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input<string>('typescript');
  readonly filename = input<string>();
  readonly caption = input<string>();
  readonly allowCopy = input<boolean>(true);
  readonly showLineNumbers = model<boolean>(true);
  readonly wrapLines = model<boolean>(false);

  readonly copied = signal<boolean>(false);

  /**
   * Computed syntax token lines for high-contrast, safe rendering.
   */
  readonly lines = computed<CodeLine[]>(() => {
    const rawCode = this.code() || '';
    const rawLines = rawCode.replace(/\r\n/g, '\n').split('\n');
    const lang = this.language() || 'typescript';

    return rawLines.map((line, idx) => ({
      lineNumber: idx + 1,
      tokens: tokenizeLine(line, lang),
    }));
  });

  toggleLineNumbers(): void {
    this.showLineNumbers.update((v) => !v);
  }

  toggleWrap(): void {
    this.wrapLines.update((v) => !v);
  }

  async copyCode(): Promise<void> {
    if (!this.allowCopy()) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(this.code());
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  }
}
