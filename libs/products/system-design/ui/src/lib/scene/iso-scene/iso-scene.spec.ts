import { TestBed } from '@angular/core/testing';
import { sceneAt } from '@ah/products/system-design/domain';
// eslint-disable-next-line @nx/enforce-module-boundaries -- internal domain test fixture, not exported from public barrel per hand-off §6
import { fixtureLesson } from '../../../../../domain/src/lib/testing/fixtures';
import { PACKET_EDGE_MS, PACKET_STAGGER_MS, SdIsoScene } from './iso-scene';

describe('SdIsoScene', () => {
  it('renders zones, edges, nodes sorted back-to-front by x + y, notes and accessible description', async () => {
    const lesson = fixtureLesson();
    const baseState = sceneAt(lesson, 3); // 'miss' step has app, db, cache, edges, and miss-note
    const stateWithZone = {
      ...baseState,
      zones: [
        {
          id: 'vpc',
          from: { x: 1, y: 0 },
          to: { x: 6, y: 3 },
          hue: 'blue' as const,
          label: 'Private VPC',
        },
      ],
    };

    const fixture = TestBed.createComponent(SdIsoScene);
    fixture.componentRef.setInput('state', stateWithZone);
    fixture.componentRef.setInput('reducedMotion', true);
    fixture.componentRef.setInput('label', 'A miss pays twice');
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg.scene-svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('A miss pays twice');

    // Verify draw order of layers in SVG DOM: zones -> grid -> edges -> nodes -> notes -> packets
    const layerClasses = Array.from(
      svg?.querySelectorAll(':scope > g') ?? [],
    ).map((g) => g.getAttribute('class'));
    expect(layerClasses).toEqual([
      'layer-zones',
      'layer-grid',
      'layer-edges',
      'layer-nodes',
      'layer-notes',
      'layer-packets',
    ]);

    // Nodes sorted by x + y:
    // app is at (2, 2) => 4; cache is at (4, 0) => 4 (tie broken by x: app 2 < cache 4); db is at (6, 2) => 8
    const slotIds = Array.from(host.querySelectorAll('.node-slot')).map((el) =>
      el.getAttribute('data-slot-id'),
    );
    expect(slotIds).toEqual(['app', 'cache', 'db']);

    // Zone, edge and note rendered
    expect(host.querySelector('[data-zone-id="vpc"]')?.textContent).toContain(
      'Private VPC',
    );
    expect(
      host.querySelector('[data-edge-id="app-db"]')?.textContent,
    ).toContain('SQL');
    expect(
      host.querySelector('[data-note-id="miss-note"]')?.textContent,
    ).toContain('miss · 41 ms');

    // Visually hidden description list
    const desc = host.querySelector('ul.visually-hidden')?.textContent ?? '';
    expect(desc).toContain('App');
    expect(desc).toContain('Database');
    expect(desc).toContain('Cache');
    expect(desc).toContain('App → Database (SQL)');
  });

  it('animates packets with WAAPI in wave order at 900ms / speed, supports pause/play and replay()', async () => {
    const animateCalls: {
      keyframes: Keyframe[];
      options: KeyframeAnimationOptions;
      paused: boolean;
    }[] = [];

    const origAnimate = Element.prototype.animate;
    Element.prototype.animate = vi.fn(function (
      keyframeArg: Keyframe[] | PropertyIndexedKeyframes | null,
      optionsArg?: number | KeyframeAnimationOptions,
    ) {
      const opts =
        typeof optionsArg === 'object' ? optionsArg : { duration: optionsArg };
      const record = {
        keyframes: (keyframeArg as Keyframe[]) ?? [],
        options: opts,
        paused: false,
      };
      animateCalls.push(record);
      return {
        play: () => {
          record.paused = false;
        },
        pause: () => {
          record.paused = true;
        },
        cancel: () => undefined,
        finished: Promise.resolve(),
      } as unknown as Animation;
    });

    try {
      const lesson = fixtureLesson();
      // Step 2 ('hit') has 2 packets in wave 0 and wave 1
      const hitState = sceneAt(lesson, 2);

      const fixture = TestBed.createComponent(SdIsoScene);
      let doneCount = 0;
      fixture.componentInstance.packetsDone.subscribe(() => doneCount++);
      fixture.componentRef.setInput('state', hitState);
      fixture.componentRef.setInput('speed', 2);
      fixture.componentRef.setInput('playing', true);
      fixture.componentRef.setInput('reducedMotion', false);
      await fixture.whenStable();

      expect(animateCalls.length).toBe(2);
      // Wave 0 at 2x speed: duration = 900 / 2 = 450, delay = 0
      expect(animateCalls[0].options.duration).toBe(PACKET_EDGE_MS / 2);
      expect(animateCalls[0].options.delay).toBe(0);
      // Wave 1 at 2x speed: delay = 450
      expect(animateCalls[1].options.duration).toBe(PACKET_EDGE_MS / 2);
      expect(animateCalls[1].options.delay).toBe(PACKET_EDGE_MS / 2);
      expect(doneCount).toBeGreaterThanOrEqual(1);

      // Pause playback
      fixture.componentRef.setInput('playing', false);
      await fixture.whenStable();
      expect(animateCalls.every((c) => c.paused)).toBe(true);

      // Replay restarts packet animations
      const beforeReplay = animateCalls.length;
      fixture.componentInstance.replay();
      await fixture.whenStable();
      expect(animateCalls.length).toBe(beforeReplay + 2);
    } finally {
      Element.prototype.animate = origAnimate;
    }
  });

  it('staggers multiple packets in the same wave and flashes edge without travel under reducedMotion', async () => {
    const lesson = fixtureLesson();
    const base = sceneAt(lesson, 0);
    const multiPacketState = {
      ...base,
      packets: [
        {
          edge: 'app-db',
          kind: 'write' as const,
          reverse: false,
          count: 3,
          label: 'INSERT',
          wave: 0,
        },
      ],
    };

    const fixture = TestBed.createComponent(SdIsoScene);
    fixture.componentRef.setInput('state', multiPacketState);
    fixture.componentRef.setInput('reducedMotion', true);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const packets = host.querySelectorAll('.packet-write');
    expect(packets.length).toBe(3);
    expect(PACKET_STAGGER_MS).toBe(150);

    // Under reducedMotion, the edge receives the packet flash class
    const edge = host.querySelector('[data-edge-id="app-db"]');
    expect(edge?.classList.contains('edge-flash-write')).toBe(true);
  });

  it('supports keyboard-accessible selectable nodes for the Design Lab', async () => {
    const lesson = fixtureLesson();
    const fixture = TestBed.createComponent(SdIsoScene);
    fixture.componentRef.setInput('state', sceneAt(lesson, 0));
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectedNodeId', 'app');

    const selected: string[] = [];
    fixture.componentInstance.nodeSelected.subscribe((id) => selected.push(id));
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const dbSlot = host.querySelector(
      '[data-slot-id="db"]',
    ) as SVGGElement | null;
    expect(dbSlot?.getAttribute('role')).toBe('button');
    expect(dbSlot?.getAttribute('tabindex')).toBe('0');
    dbSlot?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(selected).toEqual(['db']);
  });
});
