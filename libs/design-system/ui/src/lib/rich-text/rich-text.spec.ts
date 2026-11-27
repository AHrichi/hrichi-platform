import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { RichText } from './rich-text';
import { parseRichText, type RichInline } from './rich-text.parse';

/** Inline runs back as compact markup, to compare at a glance. */
function show(runs: readonly RichInline[]): string {
  return runs
    .map((run) => {
      switch (run.kind) {
        case 'strong':
          return `<b>${show(run.children)}</b>`;
        case 'em':
          return `<i>${show(run.children)}</i>`;
        case 'code':
          return `<c>${run.text}</c>`;
        default:
          return run.text;
      }
    })
    .join('');
}

const one = (text: string) => {
  const [block] = parseRichText(text);
  return block.kind === 'list' ? '' : show(block.inlines);
};

describe('parseRichText', () => {
  it('reads bold, italic and code', () => {
    expect(one('**Crop irrigation** – drip lines')).toBe(
      '<b>Crop irrigation</b> – drip lines',
    );
    expect(one('__bold__ and _italic_ and *italic*')).toBe(
      '<b>bold</b> and <i>italic</i> and <i>italic</i>',
    );
    expect(one('Set `insideC` to 18')).toBe('Set <c>insideC</c> to 18');
    expect(one('**Heat *peak* load**')).toBe('<b>Heat <i>peak</i> load</b>');
  });

  it('leaves marks that open nothing as they were typed', () => {
    expect(one('2 * 3 * 4 = 24')).toBe('2 * 3 * 4 = 24');
    expect(one('**not closed')).toBe('**not closed');
    expect(one('max_drain_ec and snake_case')).toBe(
      'max_drain_ec and snake_case',
    );
    expect(one('\\*literal\\* stars')).toBe('*literal* stars');
    expect(one('a ** b ** c')).toBe('a ** b ** c');
  });

  it('reads paragraphs, headings and both kinds of list', () => {
    const blocks = parseRichText(
      [
        'In a greenhouse water is used for:',
        '',
        '### Uses',
        '1. **Crop irrigation** – drip lines',
        '2. **Fertigation** – nutrients',
        '   with the water',
        '',
        '- fog',
        '* pads',
        '',
        'That’s all.',
      ].join('\n'),
    );
    expect(blocks.map((b) => b.kind)).toEqual([
      'paragraph',
      'heading',
      'list',
      'list',
      'paragraph',
    ]);
    const numbered = blocks[2];
    if (numbered.kind !== 'list') throw new Error('not a list');
    expect(numbered).toMatchObject({ ordered: true, start: 1 });
    expect(numbered.items.map(show)).toEqual([
      '<b>Crop irrigation</b> – drip lines',
      '<b>Fertigation</b> – nutrients\nwith the water',
    ]);
    const bullets = blocks[3];
    expect(bullets).toMatchObject({ kind: 'list', ordered: false });
  });

  it('keeps a numbered list’s first number', () => {
    expect(parseRichText('3. third\n4. fourth')[0]).toMatchObject({
      kind: 'list',
      start: 3,
    });
  });

  it('applies a transform to plain text only', () => {
    const blocks = parseRichText('**0 °C** at night, `°C` in code', (t) =>
      t.toUpperCase(),
    );
    if (blocks[0].kind === 'list') throw new Error('not a paragraph');
    expect(show(blocks[0].inlines)).toBe(
      '<b>0 °C</b> AT NIGHT, <c>°C</c> IN CODE',
    );
  });
});

describe('RichText', () => {
  async function render(text: string) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(RichText);
    fixture.componentRef.setInput('text', text);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the tree with its own elements', async () => {
    const host = await render(
      'Water does:\n\n1. **Irrigation**\n2. *Cooling* with `fog`',
    );
    expect(host.querySelectorAll('p')).toHaveLength(1);
    expect(host.querySelectorAll('ol li')).toHaveLength(2);
    expect(host.querySelector('strong')?.textContent).toBe('Irrigation');
    expect(host.querySelector('em')?.textContent).toBe('Cooling');
    expect(host.querySelector('code')?.textContent).toBe('fog');
    expect(host.textContent).not.toContain('**');
  });

  it('shows markup in the text as text, never as elements', async () => {
    const host = await render(
      '**<img src=x onerror=alert(1)>** and <script>alert(2)</script>',
    );
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('script')).toBeNull();
    expect(host.querySelector('strong')?.textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });
});
