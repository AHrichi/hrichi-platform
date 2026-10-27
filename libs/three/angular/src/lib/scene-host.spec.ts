import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SceneController, SceneModule } from '@ah/three/engine';
import { detectQuality } from '@ah/three/engine/quality';
import { SceneHost } from './scene-host';

vi.mock('@ah/three/engine/quality', () => ({ detectQuality: vi.fn() }));

interface Params {
  highlight: string | null;
}

@Component({
  imports: [SceneHost],
  template: `
    <ah-scene [load]="load" [params]="params()" (navigate)="opened = $event">
      <p class="fallback">Static view</p>
    </ah-scene>
  `,
})
class Host {
  load!: () => Promise<SceneModule<Params>>;
  readonly params = signal<Params>({ highlight: null });
  opened: string | null = null;
}

function fakeScene() {
  const controller: SceneController<Params> = {
    update: vi.fn(),
    dispose: vi.fn(),
  };
  const createScene = vi.fn<SceneModule<Params>['createScene']>(
    async () => controller,
  );
  return { controller, createScene, module: { createScene } };
}

async function setup(load: () => Promise<SceneModule<Params>>) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.load = load;
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const scene = () => element.querySelector('ah-scene') as HTMLElement;
  /** Lets the import, the extra render and the scene factory settle. */
  const settle = async () => {
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
    }
  };
  return { fixture, element, scene, settle };
}

describe('SceneHost', () => {
  // jsdom has no requestIdleCallback; run idle work at once.
  beforeEach(() => {
    window.requestIdleCallback = (callback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    };
  });

  it('keeps the static view and never loads the scene when 3D is off', async () => {
    vi.mocked(detectQuality).mockReturnValue('off');
    const load = vi.fn();
    const { element, scene, settle } = await setup(load);

    await settle();

    expect(scene().dataset['state']).toBe('fallback');
    expect(element.querySelector('.fallback')).not.toBeNull();
    expect(element.querySelector('canvas')).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('creates the scene on a canvas, then forwards params and links', async () => {
    vi.mocked(detectQuality).mockReturnValue('high');
    const { controller, createScene, module } = fakeScene();
    const { fixture, element, scene, settle } = await setup(async () => module);

    await settle();

    expect(scene().dataset['state']).toBe('ready');
    const [init] = createScene.mock.calls[0];
    expect(init.canvas).toBe(element.querySelector('canvas'));
    expect(init.tier).toBe('high');
    expect(init.params).toEqual({ highlight: null });

    fixture.componentInstance.params.set({ highlight: 'shell' });
    await fixture.whenStable();
    expect(controller.update).toHaveBeenCalledWith({ highlight: 'shell' });

    init.events.navigate('/labs/hello');
    expect(fixture.componentInstance.opened).toBe('/labs/hello');

    init.events.hover({ id: 'shell', label: 'shell', x: 10, y: 20 });
    await fixture.whenStable();
    expect(element.querySelector('.ah-scene__label')?.textContent).toContain(
      'shell',
    );
  });

  it('disposes the scene when the host is destroyed', async () => {
    vi.mocked(detectQuality).mockReturnValue('low');
    const { controller, module } = fakeScene();
    const { fixture, settle } = await setup(async () => module);
    await settle();

    fixture.destroy();

    expect(controller.dispose).toHaveBeenCalled();
  });

  it('falls back to the static view when the scene fails', async () => {
    vi.mocked(detectQuality).mockReturnValue('high');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { element, scene, settle } = await setup(() =>
      Promise.reject(new Error('chunk blocked')),
    );

    await settle();

    expect(scene().dataset['state']).toBe('fallback');
    expect(element.querySelector('canvas')).toBeNull();
  });
});
