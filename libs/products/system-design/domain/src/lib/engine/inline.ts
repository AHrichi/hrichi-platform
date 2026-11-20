export interface InlineToken {
  kind: 'text' | 'bold' | 'code' | 'em';
  text: string;
}

const MARK = /\*\*([^*]+)\*\*|`([^`]+)`|_([^_]+)_/g;

/**
 * Splits lesson text into runs: `**bold**`, `` `code` `` and `_term_`.
 * Unbalanced or unknown marks stay as literal text. Never produces HTML: the
 * ui renders each run with `[textContent]`.
 */
export function parseInline(text: string): InlineToken[] {
  const out: InlineToken[] = [];
  const push = (kind: InlineToken['kind'], value: string) => {
    if (!value) return;
    const prev = out[out.length - 1];
    if (kind === 'text' && prev?.kind === 'text') prev.text += value;
    else out.push({ kind, text: value });
  };
  let at = 0;
  for (const m of text.matchAll(MARK)) {
    const start = m.index ?? 0;
    push('text', text.slice(at, start));
    if (m[1] !== undefined) push('bold', m[1]);
    else if (m[2] !== undefined) push('code', m[2]);
    else push('em', m[3] ?? '');
    at = start + m[0].length;
  }
  push('text', text.slice(at));
  return out;
}

/** The text without its marks, for word counts and search. */
export function plainText(text: string): string {
  return parseInline(text)
    .map((t) => t.text)
    .join('');
}

export function wordCount(text: string): number {
  const plain = plainText(text).trim();
  return plain ? plain.split(/\s+/).length : 0;
}
