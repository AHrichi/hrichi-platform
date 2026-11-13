import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { decodeHandoff } from '@ah/learning/contracts';
import { APP_MODE, type AppMode } from '@ah/platform/app-mode';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LearnThis } from './learn-this';
import { LearningClient } from './learning-client';
import { LearningLink } from './learning-link';

describe('LearningClient & LearnThis', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function setup(mode: AppMode, linked = false) {
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      imports: [LearnThis],
      providers: [
        provideZonelessChangeDetection(),
        { provide: APP_MODE, useValue: mode },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: LearningLink,
          useValue: {
            linked: signal(linked),
            send: vi.fn().mockReturnValue(1),
            isSent: vi.fn().mockReturnValue(false),
          },
        },
      ],
    });
    const client = TestBed.inject(LearningClient);
    const fixture = TestBed.createComponent(LearnThis);
    fixture.componentRef.setInput('items', [
      { text: 'BFS explores level by level', source: null },
    ]);
    fixture.componentRef.setInput('label', 'Add to my daily reviews');
    fixture.detectChanges();
    return { client, fixture, navigateByUrl };
  }

  it('offers both a standalone Learning Engine link and a demo button in embedded-demo mode', () => {
    const { client, fixture, navigateByUrl } = setup('embedded-demo');
    const el = fixture.nativeElement as HTMLElement;

    expect(client.isEmbeddedDemo).toBe(true);
    const link = el.querySelector<HTMLAnchorElement>('a[target="_blank"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('rel')).toContain('noopener');
    const href = link?.getAttribute('href') ?? '';
    expect(href).toMatch(/^http:\/\/localhost:4311\/inbox#capture=/);
    const decoded = decodeHandoff(href.slice(href.indexOf('#')));
    expect(decoded).toEqual([
      { text: 'BFS explores level by level', source: null },
    ]);

    const demoBtn = el.querySelector<HTMLButtonElement>('button');
    expect(demoBtn?.textContent?.trim()).toBe('Try in demo');
    demoBtn?.click();
    expect(navigateByUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^\/apps\/learning\/inbox#capture=/),
    );
  });

  it('resolves production and localhost standalone inbox URLs', () => {
    const { client } = setup('embedded-demo');
    const items = [{ text: 'Graph traversal', source: null }];
    expect(
      client.captureHref(items, { standalone: true, isLocalHost: true }),
    ).toMatch(/^http:\/\/localhost:4311\/inbox#capture=/);
    expect(
      client.captureHref(items, { standalone: true, isLocalHost: false }),
    ).toMatch(
      /^https:\/\/product-learning\.ahmed-hrichi\.workers\.dev\/inbox#capture=/,
    );
  });

  it('disables both actions when items are empty in embedded-demo mode', () => {
    const { fixture } = setup('embedded-demo');
    const el = fixture.nativeElement as HTMLElement;
    const sent = vi.fn();
    fixture.componentInstance.sent.subscribe(sent);
    fixture.componentRef.setInput('items', [{ text: '   ', source: null }]);
    fixture.detectChanges();

    const link = el.querySelector<HTMLAnchorElement>('a');
    expect(link?.getAttribute('href')).toBeNull();
    expect(link?.getAttribute('aria-disabled')).toBe('true');
    link?.click();
    expect(sent).not.toHaveBeenCalled();

    const demoBtn = el.querySelector<HTMLButtonElement>('button');
    expect(demoBtn?.disabled).toBe(true);
  });

  it('renders a single button in standalone mode', () => {
    const { client, fixture } = setup('standalone');
    const el = fixture.nativeElement as HTMLElement;

    expect(client.isEmbeddedDemo).toBe(false);
    expect(el.querySelector('a')).toBeNull();
    const button = el.querySelector<HTMLButtonElement>('button');
    expect(button?.textContent).toContain('Add to my daily reviews');
  });
});
