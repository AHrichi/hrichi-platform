import type * as v from 'valibot';

export type IssueCode =
  | 'wrong-type'
  | 'missing-field'
  | 'unknown-field'
  | 'not-allowed'
  | 'unknown-kind'
  | 'bad-id'
  | 'bad-format'
  | 'too-short'
  | 'too-long'
  | 'too-few'
  | 'too-many'
  | 'out-of-range'
  | 'duplicate-id'
  | 'unknown-ref'
  | 'shape'
  | 'illegal-op'
  | 'precondition'
  | 'mode-conflict'
  | 'markup'
  | 'pedagogy'
  | 'invalid';

/**
 * One problem, addressed by a JSON pointer into the checked value, so the
 * repair call can tell the model exactly which field to fix.
 */
export interface Issue {
  path: string;
  code: IssueCode;
  message: string;
  severity: 'error' | 'warning';
}

export type ValidationResult<T> =
  { ok: true; value: T; warnings: Issue[] } | { ok: false; issues: Issue[] };

/** `pointer('/sections/0', 'blocks', 2)` → `/sections/0/blocks/2`. */
export function pointer(
  base: string,
  ...segments: (string | number)[]
): string {
  return segments.reduce<string>(
    (path, segment) =>
      `${path}/${String(segment).replace(/~/g, '~0').replace(/\//g, '~1')}`,
    base,
  );
}

export class IssueList {
  readonly all: Issue[] = [];

  error(path: string, code: IssueCode, message: string): void {
    this.all.push({ path, code, message, severity: 'error' });
  }

  warn(path: string, code: IssueCode, message: string): void {
    this.all.push({ path, code, message, severity: 'warning' });
  }

  get errors(): Issue[] {
    return this.all.filter((issue) => issue.severity === 'error');
  }

  get warnings(): Issue[] {
    return this.all.filter((issue) => issue.severity === 'warning');
  }
}

const quote = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value);

/**
 * Valibot's issues as ours. Messages say what to change, because they go
 * back to the model verbatim when a block needs repairing.
 */
export function fromValibot(
  issues: readonly v.BaseIssue<unknown>[],
  base = '',
): Issue[] {
  return issues.map((issue) => {
    const keys = (issue.path ?? []).map((item) => item.key as string | number);
    const path = pointer(base, ...keys);
    const field = keys.length ? String(keys[keys.length - 1]) : 'value';
    const received = issue.received;
    const error = (code: IssueCode, message: string): Issue => ({
      path,
      code,
      message,
      severity: 'error',
    });
    const isArray = Array.isArray(issue.input);
    switch (issue.type) {
      case 'variant':
        return error(
          'unknown-kind',
          `"${field}" must be one of ${issue.expected}; got ${received}.`,
        );
      case 'strict_object':
        return received === 'undefined'
          ? error(
              'missing-field',
              `Missing field "${field}". Every field is required: use null for one that does not apply.`,
            )
          : error(
              'unknown-field',
              `Remove "${field}": it is not part of this schema.`,
            );
      case 'min_length':
        return isArray
          ? error(
              'too-few',
              `"${field}" needs at least ${quote(issue.requirement)} items; it has ${received}.`,
            )
          : error(
              'too-short',
              issue.requirement === 1
                ? `"${field}" must not be empty.`
                : `"${field}" needs at least ${quote(issue.requirement)} characters.`,
            );
      case 'max_length':
        return isArray
          ? error(
              'too-many',
              `"${field}" allows at most ${quote(issue.requirement)} items; it has ${received}.`,
            )
          : error(
              'too-long',
              `"${field}" allows at most ${quote(issue.requirement)} characters; it has ${received}.`,
            );
      case 'regex':
        return error(
          'bad-id',
          `"${field}" must be a kebab-case id: lowercase letters, digits and dashes, starting with a letter; got ${received}.`,
        );
      case 'picklist':
      case 'literal':
        return error(
          'not-allowed',
          `"${field}" must be ${issue.expected}; got ${received}.`,
        );
      case 'integer':
        return error(
          'wrong-type',
          `"${field}" must be a whole number; got ${received}.`,
        );
      case 'min_value':
      case 'max_value':
        return error(
          'out-of-range',
          `"${field}" must be ${issue.expected}; got ${received}.`,
        );
      default:
        return issue.kind === 'schema'
          ? error(
              'wrong-type',
              `"${field}" must be ${issue.expected}; got ${received}.`,
            )
          : error('invalid', issue.message);
    }
  });
}
