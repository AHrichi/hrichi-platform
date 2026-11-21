import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { encodeHandoff, HANDOFF_KEY } from '@ah/learning/contracts';
import { VoiceRecorder } from '../../capture/voice-recorder';
import { LearningStore } from '../../store/learning.store';
import { InboxScreen } from './inbox-screen';

describe('InboxScreen', () => {
  it('labels incoming captures from System Design using APP_NAMES', async () => {
    const originalHash = globalThis.location.hash;
    const encoded = encodeHandoff([
      {
        text: 'Front\nBack',
        source: {
          app: 'system-design',
          objectType: 'lesson-card',
          objectId: 'request-journey:key',
          deepLink: 'https://example.com/learn/request-journey/11',
          excerpt: 'One Request, End to End',
        },
      },
    ]);
    globalThis.history.replaceState(
      globalThis.history.state,
      '',
      `${globalThis.location.pathname}#${HANDOFF_KEY}=${encoded}`,
    );

    try {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          {
            provide: LearningStore,
            useValue: {
              ready: signal(true),
              drafts: signal([]),
              revising: signal([]),
              captures: signal([]),
              linkSuggestions: signal([]),
              inProgress: signal([]),
              captureItems: vi.fn(),
              capture: vi.fn(),
              captureVoice: vi.fn(),
              keep: vi.fn(),
              discard: vi.fn(),
              simpler: vi.fn(),
              dismissLink: vi.fn(),
              confirmLink: vi.fn(),
              retryCapture: vi.fn(),
              processAnyway: vi.fn(),
              dismissCapture: vi.fn(),
            },
          },
          {
            provide: VoiceRecorder,
            useValue: {
              state: signal('idle'),
              seconds: signal(0),
              start: vi.fn(),
              stop: vi.fn(),
              cancel: vi.fn(),
            },
          },
        ],
      });

      const fixture = TestBed.createComponent(InboxScreen);
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('#incoming-title')?.textContent?.trim()).toBe(
        'Save this idea from System Design?',
      );
    } finally {
      globalThis.history.replaceState(
        globalThis.history.state,
        '',
        `${globalThis.location.pathname}${originalHash}`,
      );
    }
  });
});
