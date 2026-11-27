import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ChatMessage,
  type ChatMessageFrom,
  isolateUnits,
} from './chat-message';

@Component({
  imports: [ChatMessage],
  template: `<ah-chat-message
    [from]="from()"
    [text]="text()"
    [typing]="typing()"
    typingLabel="Writing…"
  />`,
})
class Host {
  readonly from = signal<ChatMessageFrom>('assistant');
  readonly text = signal('<b>bold?</b> 322 kW');
  readonly typing = signal(false);
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const message = fixture.nativeElement.querySelector(
    'ah-chat-message',
  ) as HTMLElement;
  return { fixture, host: fixture.componentInstance, message };
}

describe('isolateUnits', () => {
  it('keeps a temperature unit whole in right-to-left text', () => {
    const LRI = String.fromCharCode(0x2066);
    const PDI = String.fromCharCode(0x2069);
    expect(isolateUnits('عند 0 °C.')).toBe(`عند 0 ${LRI}°C${PDI}.`);
    expect(isolateUnits('18°F and 291 °K')).toBe(
      `18${LRI}°F${PDI} and 291 ${LRI}°K${PDI}`,
    );
    // Not a unit: a degree of angle, or a word after the sign.
    expect(isolateUnits('a 30° roof, °Celsius')).toBe('a 30° roof, °Celsius');
  });
});

describe('ChatMessage', () => {
  it('shows a model’s text as text, never as markup', async () => {
    const { message } = await setup();
    expect(message.querySelector('b')).toBeNull();
    expect(message.textContent).toContain('<b>bold?</b> 322 kW');
  });

  it('says who it is from, for its side of the column', async () => {
    const { fixture, host, message } = await setup();
    expect(message.dataset['from']).toBe('assistant');
    host.from.set('user');
    await fixture.whenStable();
    expect(message.dataset['from']).toBe('user');
  });

  it('announces typing once, as a status', async () => {
    const { fixture, host, message } = await setup();
    host.typing.set(true);
    await fixture.whenStable();
    const status = message.querySelector('[role="status"]');
    expect(status?.getAttribute('aria-label')).toBe('Writing…');
    expect(message.querySelector('.text')).toBeNull();
  });

  it('formats a model’s answer when asked, and keeps the reader’s as typed', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ChatMessage);
    const message = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput(
      'text',
      ['**Fog** cools the air:', '', '- fast', '- cheap'].join('\n'),
    );
    fixture.componentRef.setInput('format', 'rich');
    await fixture.whenStable();
    expect(message.querySelector('ah-rich-text strong')?.textContent).toBe(
      'Fog',
    );
    expect(message.querySelectorAll('ul li')).toHaveLength(2);
    expect(message.textContent).not.toContain('**');

    fixture.componentRef.setInput('format', 'plain');
    await fixture.whenStable();
    expect(message.querySelector('strong')).toBeNull();
    expect(message.textContent).toContain('**Fog**');
  });
});
