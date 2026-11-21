import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CheatSection } from '@ah/products/system-design/domain';
import { SdCheatSection } from './cheat-section';

async function render(section: CheatSection) {
  const fixture = TestBed.createComponent(SdCheatSection);
  fixture.componentRef.setInput('section', section);
  fixture.componentRef.setInput('sectionId', 'sec-1');
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('SdCheatSection', () => {
  it('draws a numbers section as label, value and optional note', async () => {
    const host = await render({
      kind: 'numbers',
      title: 'Handy numbers',
      rows: [
        ['RAM read', '100 ns', 'Fast'],
        ['Disk seek', '10 ms'],
      ],
    });
    expect(host.getAttribute('data-kind')).toBe('numbers');
    expect(host.querySelector('h2')?.id).toBe('sec-1-title');
    expect(host.querySelectorAll('.number-row')).toHaveLength(2);
    expect(host.querySelectorAll('.number-note')).toHaveLength(1);
    expect(host.querySelector('.number-value')?.textContent).toContain(
      '100 ns',
    );
  });

  it('draws a table with column headers and row headers', async () => {
    const host = await render({
      kind: 'table',
      title: 'Algorithms',
      columns: ['Name', 'Idea'],
      rows: [
        ['Round robin', 'Take turns'],
        ['Hash', 'hash(key) mod N'],
      ],
    });
    expect(host.querySelectorAll('th[scope="col"]')).toHaveLength(2);
    const rowHeads = [...host.querySelectorAll('th[scope="row"]')].map((th) =>
      th.textContent?.trim(),
    );
    expect(rowHeads).toEqual(['Round robin', 'Hash']);
    const region = host.querySelector('[role="region"]');
    expect(region?.getAttribute('aria-labelledby')).toBe('sec-1-title');
    expect(region?.getAttribute('tabindex')).toBe('0');
  });

  it('draws a list', async () => {
    const host = await render({
      kind: 'list',
      title: 'Rules',
      items: ['One', 'Two', 'Three'],
    });
    expect(host.querySelectorAll('li')).toHaveLength(3);
  });

  it('draws a pattern and projects its lesson link', async () => {
    @Component({
      imports: [SdCheatSection],
      template: `
        <sd-cheat-section [section]="section" sectionId="p">
          <a sdCheatLink href="/learn/caching/1">Open the lesson</a>
        </sd-cheat-section>
      `,
    })
    class Host {
      section: CheatSection = {
        kind: 'pattern',
        title: 'Stampede protection',
        when: 'A hot key expires',
        how: 'Coalesce misses',
        watch: 'Lock leases',
        lesson: 'caching',
      };
    }
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const terms = [...host.querySelectorAll('dt')].map((d) =>
      d.textContent?.trim(),
    );
    expect(terms).toEqual(['When', 'How', 'Watch out']);
    expect(host.querySelector('.pattern-link a')?.textContent).toContain(
      'Open the lesson',
    );
  });
});
