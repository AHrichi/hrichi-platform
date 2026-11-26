import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChatMessage, type ChatMessageFrom } from './chat-message';

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
});
