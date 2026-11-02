/**
 * The Markdown a lesson's prose may use: paragraphs, `-` and `1.` lists,
 * *emphasis*, **strong**, `code` and [links](https://…). The result is a
 * token tree the renderer turns into elements; no HTML string is ever built,
 * so model output can't inject markup. Anything else stays plain text.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'em'; children: Inline[] }
  | { type: 'strong'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] };

export type MarkdownBlock =
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] };

const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length) {
      blocks.push({
        type: 'paragraph',
        children: parseInline(paragraph.join(' ')),
      });
      paragraph = [];
    }
    if (list) {
      blocks.push({
        type: 'list',
        ordered: list.ordered,
        items: list.items.map(parseInline),
      });
      list = null;
    }
  };

  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      const ordered = numbered !== null;
      if (paragraph.length || (list && list.ordered !== ordered)) flush();
      list ??= { ordered, items: [] };
      list.items.push(item[1]);
    } else if (list && /^\s{2,}\S/.test(raw)) {
      // An indented line continues the last item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      if (list) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
}

/**
 * A link: `[words](target)`. Spec notation like `O.[[Get]](P, Receiver)`
 * isn't one, since the words can't hold brackets and the target no spaces.
 */
export const LINKS = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const LINK = new RegExp(`^${LINKS.source}`);

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let text = '';
  const pushText = () => {
    if (text) out.push({ type: 'text', text });
    text = '';
  };

  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);

    if (rest[0] === '`') {
      const end = source.indexOf('`', i + 1);
      if (end > i + 1) {
        pushText();
        out.push({ type: 'code', text: source.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (rest.startsWith('**')) {
      const end = source.indexOf('**', i + 2);
      if (end > i + 2) {
        pushText();
        out.push({
          type: 'strong',
          children: parseInline(source.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if (rest[0] === '*' || rest[0] === '_') {
      const mark = rest[0];
      const end = source.indexOf(mark, i + 1);
      // `a * b * c` is arithmetic, not emphasis: the marks must hug words.
      if (end > i + 1 && rest[1] !== ' ' && source[end - 1] !== ' ') {
        pushText();
        out.push({
          type: 'em',
          children: parseInline(source.slice(i + 1, end)),
        });
        i = end + 1;
        continue;
      }
    }

    if (rest[0] === '[') {
      const link = LINK.exec(rest);
      if (link) {
        pushText();
        const href = safeHref(link[2]);
        const children = parseInline(link[1]);
        // A link to anything but https keeps its words and drops the target.
        out.push(
          ...(href ? [{ type: 'link' as const, href, children }] : children),
        );
        i += link[0].length;
        continue;
      }
    }

    text += source[i];
    i++;
  }
  pushText();
  return out;
}

function safeHref(href: string): string | null {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
