import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { iso, type SceneNode } from '@ah/products/system-design/domain';
import { SdCubeGlyph } from './cube-glyph';
import { SdCylinderGlyph } from './cylinder-glyph';
import { SdDeviceGlyph } from './device-glyph';
import { SdDiskGlyph } from './disk-glyph';
import { SdGlobeGlyph } from './globe-glyph';
import { formatLoadChip } from './glyph-geometry';
import { SdPersonGlyph } from './person-glyph';
import { SdStackGlyph } from './stack-glyph';

@Component({
  selector: 'sd-test-glyph-host',
  imports: [
    SdCubeGlyph,
    SdCylinderGlyph,
    SdDeviceGlyph,
    SdStackGlyph,
    SdGlobeGlyph,
    SdPersonGlyph,
    SdDiskGlyph,
  ],
  template: `
    <svg viewBox="-200 -200 400 400">
      <g sd-cube-glyph [node]="cube()" [fresh]="fresh()" />
      <g sd-cylinder-glyph [node]="cylinder()" />
      <g sd-device-glyph [node]="device()" />
      <g sd-stack-glyph [node]="stack()" />
      <g sd-globe-glyph [node]="globe()" />
      <g sd-person-glyph [node]="person()" />
      <g sd-disk-glyph [node]="disk()" />
    </svg>
  `,
})
class TestGlyphHost {
  readonly fresh = signal(true);
  readonly cube = signal<SceneNode>({
    id: 'srv',
    kind: 'server',
    at: { x: 2, y: 1 },
    label: 'Web server',
    sublabel: '2x vCPU',
  });
  readonly cylinder = signal<SceneNode>({
    id: 'db',
    kind: 'database',
    at: { x: 4, y: 1 },
    label: 'Primary DB',
    load: 0.72,
  });
  readonly device = signal<SceneNode>({
    id: 'client',
    kind: 'client',
    at: { x: 0, y: 1 },
    label: 'Laptop',
  });
  readonly stack = signal<SceneNode>({
    id: 'q',
    kind: 'queue',
    at: { x: 3, y: 2 },
    label: 'Jobs queue',
  });
  readonly globe = signal<SceneNode>({
    id: 'cdn',
    kind: 'cdn',
    at: { x: 1, y: 0 },
    label: 'Edge CDN',
  });
  readonly person = signal<SceneNode>({
    id: 'you',
    kind: 'user',
    at: { x: 0, y: 0 },
    label: 'You',
    sublabel: 'Browser',
  });
  readonly disk = signal<SceneNode>({
    id: 's3',
    kind: 'storage',
    at: { x: 5, y: 2 },
    label: 'Blob store',
  });
}

describe('Isometric glyphs', () => {
  it('draws all seven glyph shapes with top, left and right faces positioned via iso()', async () => {
    const fixture = TestBed.createComponent(TestGlyphHost);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const expected = [
      { id: 'srv', hue: 'blue', at: { x: 2, y: 1 } },
      { id: 'db', hue: 'violet', at: { x: 4, y: 1 } },
      { id: 'client', hue: 'neutral', at: { x: 0, y: 1 } },
      { id: 'q', hue: 'rose', at: { x: 3, y: 2 } },
      { id: 'cdn', hue: 'teal', at: { x: 1, y: 0 } },
      { id: 'you', hue: 'neutral', at: { x: 0, y: 0 } },
      { id: 's3', hue: 'amber', at: { x: 5, y: 2 } },
    ] as const;

    for (const item of expected) {
      const g = host.querySelector(`g[data-node-id="${item.id}"]`);
      expect(g).not.toBeNull();
      expect(g?.getAttribute('data-hue')).toBe(item.hue);
      expect(g?.classList.contains(`hue-${item.hue}`)).toBe(true);
      const pt = iso(item.at);
      expect(g?.getAttribute('transform')).toBe(`translate(${pt.x} ${pt.y})`);
      expect(g?.querySelector('.top')).not.toBeNull();
      expect(g?.querySelector('.top')?.namespaceURI).toBe(
        'http://www.w3.org/2000/svg',
      );
      expect(g?.querySelector('.left')).not.toBeNull();
      expect(g?.querySelector('.right')).not.toBeNull();
    }

    // Sublabel and load chip
    const srv = host.querySelector('g[data-node-id="srv"]');
    expect(srv?.textContent).toContain('Web server');
    expect(srv?.textContent).toContain('2x vCPU');
    expect(
      srv?.querySelector('.glyph-inner')?.classList.contains('is-fresh'),
    ).toBe(true);

    const db = host.querySelector('g[data-node-id="db"]');
    expect(db?.querySelector('.load-chip')?.textContent).toContain('■■■□ 72%');
    expect(
      db?.querySelector('.load-chip')?.classList.contains('load-critical'),
    ).toBe(false);
  });

  it('renders focus, hot, down, dim states and critical load chips (>= 90%)', async () => {
    const fixture = TestBed.createComponent(TestGlyphHost);
    fixture.componentInstance.cube.set({
      id: 'srv',
      kind: 'server',
      at: { x: 2, y: 1 },
      label: 'Web server',
      state: 'focus',
    });
    fixture.componentInstance.cylinder.set({
      id: 'db',
      kind: 'database',
      at: { x: 4, y: 1 },
      label: 'Primary DB',
      state: 'hot',
      badge: 'stale',
      load: 0.95,
    });
    fixture.componentInstance.stack.set({
      id: 'q',
      kind: 'queue',
      at: { x: 3, y: 2 },
      label: 'Jobs queue',
      state: 'down',
    });
    fixture.componentInstance.globe.set({
      id: 'cdn',
      kind: 'cdn',
      at: { x: 1, y: 0 },
      label: 'Edge CDN',
      state: 'dim',
    });
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;

    const focusNode = host.querySelector('g[data-node-id="srv"]');
    expect(focusNode?.querySelector('.focus-outline')).not.toBeNull();

    const hotNode = host.querySelector('g[data-node-id="db"]');
    expect(hotNode?.getAttribute('data-hue')).toBe('red');
    expect(hotNode?.classList.contains('hue-red')).toBe(true);
    expect(hotNode?.querySelector('.badge-chip')?.textContent).toContain(
      '! stale',
    );
    const loadChip = hotNode?.querySelector('.load-chip');
    expect(loadChip?.textContent).toContain('■■■■ 95%');
    expect(loadChip?.classList.contains('load-critical')).toBe(true);

    const downNode = host.querySelector('g[data-node-id="q"]');
    expect(downNode?.getAttribute('data-hue')).toBe('neutral');
    expect(downNode?.querySelector('.down-overlay')).not.toBeNull();
    expect(downNode?.querySelector('.down-mark')).not.toBeNull();

    const dimNode = host.querySelector('g[data-node-id="cdn"]');
    expect(dimNode?.classList.contains('state-dim')).toBe(true);
  });

  it('formats load chips across boundary ratios', () => {
    expect(formatLoadChip(null)).toBeNull();
    expect(formatLoadChip(0)?.text).toBe('□□□□ 0%');
    expect(formatLoadChip(0.25)?.text).toBe('■□□□ 25%');
    expect(formatLoadChip(0.72)?.text).toBe('■■■□ 72%');
    expect(formatLoadChip(0.89)?.critical).toBe(false);
    expect(formatLoadChip(0.9)?.critical).toBe(true);
    expect(formatLoadChip(1.25)?.text).toBe('■■■■ 125%');
  });
});
