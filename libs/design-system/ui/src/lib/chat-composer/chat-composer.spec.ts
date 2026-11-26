import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChatComposer } from './chat-composer';

@Component({
  imports: [ChatComposer],
  template: `<ah-chat-composer
    label="Message"
    [busy]="busy()"
    (send)="sent.push($event)"
    (stop)="stopped = stopped + 1"
  />`,
})
class Host {
  readonly busy = signal(false);
  readonly sent: string[] = [];
  stopped = 0;
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const field = root.querySelector('textarea') as HTMLTextAreaElement;
  const type = async (text: string) => {
    field.value = text;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const press = async (init: KeyboardEventInit) => {
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', ...init }),
    );
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, field, type, press };
}

describe('ChatComposer', () => {
  it('sends on Enter, trimmed, and clears', async () => {
    const { host, field, type, press } = await setup();
    await type('  How much heat?  ');
    await press({});
    expect(host.sent).toEqual(['How much heat?']);
    expect(field.value).toBe('');
  });

  it('keeps Shift+Enter for a new line, and Enter while composing', async () => {
    const { host, type, press } = await setup();
    await type('مرحبا');
    await press({ shiftKey: true });
    await press({ isComposing: true });
    expect(host.sent).toEqual([]);
  });

  it('sends nothing empty, and offers Stop while busy', async () => {
    const { fixture, host, root, type, press } = await setup();
    await type('   ');
    await press({});
    expect(host.sent).toEqual([]);
    host.busy.set(true);
    await fixture.whenStable();
    const stop = root.querySelector('button') as HTMLButtonElement;
    expect(stop.getAttribute('aria-label')).toBe('Stop');
    stop.click();
    expect(host.stopped).toBe(1);
    await type('More');
    await press({});
    expect(host.sent).toEqual([]);
  });
});
