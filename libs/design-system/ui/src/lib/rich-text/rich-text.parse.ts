/**
 * A small, safe subset of Markdown, as a typed tree for a template to draw:
 * nothing here is ever turned into HTML, so whatever a model or a person
 * writes is shown, never run.
 *
 * - Blocks: paragraphs (blank lines between), bulleted (`-`, `*`, `•`) and
 *   numbered (`1.`, `1)`) lists, and headings (`#`…) shown as a bold line.
 * - Inline: `**bold**` or `__bold__`, `*italic*` or `_italic_`, `` `code` ``,
 *   and `\*` for a literal mark.
 * - A mark that isn't closed, or reads as arithmetic (`2 * 3`), stays as
 *   it was typed. Tables, links and images stay plain text.
 */
export type RichInline =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'strong'; readonly children: readonly RichInline[] }
  | { readonly kind: 'em'; readonly children: readonly RichInline[] }
  | { readonly kind: 'code'; readonly text: string };

export type RichBlock =
  | { readonly kind: 'paragraph'; readonly inlines: readonly RichInline[] }
  | { readonly kind: 'heading'; readonly inlines: readonly RichInline[] }
  | {
      readonly kind: 'list';
      readonly ordered: boolean;
      /** The first item's number, for a numbered list. */
      readonly start: number;
      readonly items: readonly (readonly RichInline[])[];
    };

/** Marks inside marks, at most: deeper ones stay as typed. */
const MAX_DEPTH = 3;

const BULLET = /^\s*[-*•+]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,4})[.)]\s+(.*)$/;
const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;

/** Text as blocks; `transform` is applied to every run of plain text. */
export function parseRichText(
  source: string,
  transform: (text: string) => string = (text) => text,
): RichBlock[] {
  const blocks: RichBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; start: number; items: string[] } | null = null;

  const inline = (text: string) => parseInline(text, transform, 0);
  const endParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'paragraph', inlines: inline(paragraph.join('\n')) });
      paragraph = [];
    }
  };
  const endList = () => {
    if (list) {
      blocks.push({
        kind: 'list',
        ordered: list.ordered,
        start: list.start,
        items: list.items.map(inline),
      });
      list = null;
    }
  };

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      endParagraph();
      endList();
      continue;
    }
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    if (heading) {
      endParagraph();
      endList();
      blocks.push({ kind: 'heading', inlines: inline(heading[1]) });
    } else if (bullet || numbered) {
      endParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) endList();
      list ??= {
        ordered,
        start: numbered ? Number(numbered[1]) : 1,
        items: [],
      };
      list.items.push(numbered ? numbered[2] : (bullet?.[1] ?? ''));
    } else if (list && /^\s/.test(line)) {
      // An indented line goes on with the item above.
      list.items[list.items.length - 1] += `\n${line.trim()}`;
    } else {
      endList();
      paragraph.push(line);
    }
  }
  endParagraph();
  endList();
  return blocks;
}

const isSpace = (char: string | undefined) => !char || /\s/.test(char);
const isWord = (char: string | undefined) =>
  Boolean(char) && /[\p{L}\p{N}]/u.test(char as string);

/** Where a mark that closes one opened at `from` is, or -1. */
function closing(text: string, mark: string, from: number): number {
  for (
    let at = text.indexOf(mark, from);
    at >= 0;
    at = text.indexOf(mark, at + 1)
  ) {
    if (text[at - 1] === '\\' || isSpace(text[at - 1])) continue;
    const single = mark.length === 1;
    // A single mark isn't half of a double one.
    if (single && (text[at + 1] === mark || text[at - 1] === mark)) continue;
    // `_` closes only at the end of a word (snake_case stays as it is).
    if (mark[0] === '_' && isWord(text[at + mark.length])) continue;
    return at;
  }
  return -1;
}

function parseInline(
  text: string,
  transform: (text: string) => string,
  depth: number,
): RichInline[] {
  const out: RichInline[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer) out.push({ kind: 'text', text: transform(buffer) });
    buffer = '';
  };

  for (let i = 0; i < text.length;) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '\\' && next && '*_`\\'.includes(next)) {
      buffer += next;
      i += 2;
      continue;
    }

    if (char === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i + 1) {
        flush();
        out.push({ kind: 'code', text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    const marked = (char === '*' || char === '_') && depth < MAX_DEPTH;
    const opensWord = char !== '_' || !isWord(text[i - 1]);

    // **bold** or __bold__
    if (marked && next === char && opensWord && !isSpace(text[i + 2])) {
      const mark = char + char;
      const end = closing(text, mark, i + 2);
      if (end > i + 2) {
        flush();
        out.push({
          kind: 'strong',
          children: parseInline(text.slice(i + 2, end), transform, depth + 1),
        });
        i = end + 2;
        continue;
      }
    }

    // *italic* or _italic_
    if (marked && next !== char && opensWord && !isSpace(next)) {
      const end = closing(text, char, i + 1);
      if (end > i + 1) {
        flush();
        out.push({
          kind: 'em',
          children: parseInline(text.slice(i + 1, end), transform, depth + 1),
        });
        i = end + 1;
        continue;
      }
    }

    buffer += char;
    i++;
  }
  flush();
  return out;
}
