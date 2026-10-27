import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Audience } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { ContactForm } from './contact-form';
import { type SiteConfig, SiteConfigService } from '@ah/shared/site-config';
import { TurnstileService } from './turnstile';

const enabled: SiteConfig = {
  apiUrl: 'https://api.test',
  turnstileSiteKey: 'site-key',
  orbitApiUrl: null,
};

/** Renders the form with a config and a Turnstile that passes at once. */
async function setup({
  config = enabled,
  audience = 'client',
}: { config?: SiteConfig; audience?: Audience } = {}) {
  const widget = { reset: vi.fn(), remove: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: SiteConfigService, useValue: { load: async () => config } },
      {
        provide: TurnstileService,
        useValue: {
          render: async (
            _host: HTMLElement,
            _key: string,
            onToken: (token: string | null) => void,
          ) => {
            onToken('turnstile-token');
            return widget;
          },
        },
      },
    ],
  });
  TestBed.inject(PreferencesStore).setAudience(audience);
  const fixture = TestBed.createComponent(ContactForm);
  const element = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
  return { fixture, element, widget };
}

function fill(element: HTMLElement, id: string, value: string): void {
  const field = element.querySelector<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(`#${id}`);
  if (!field) throw new Error(`No #${id}`);
  field.value = value;
  field.dispatchEvent(
    new Event(field.tagName === 'SELECT' ? 'change' : 'input'),
  );
}

function fillValidLead(element: HTMLElement): void {
  fill(element, 'contact-name', 'Ada Lovelace');
  fill(element, 'contact-email', 'ada@example.com');
  fill(element, 'contact-message', 'We need an Angular lead for Q1.');
}

function submit(element: HTMLElement): void {
  element
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { cancelable: true }));
}

/** fetch for /health (the wake-up ping) and /leads. */
function stubFetch(leadsStatus: number) {
  const fetchFn = vi.fn(async (url: string) =>
    url.endsWith('/leads')
      ? new Response(JSON.stringify({ id: 'abc', status: 'accepted' }), {
          status: leadsStatus,
        })
      : new Response('{}'),
  );
  vi.stubGlobal('fetch', fetchFn);
  return fetchFn;
}

const leadCalls = (fetchFn: ReturnType<typeof stubFetch>) =>
  fetchFn.mock.calls.filter(([url]) => url.endsWith('/leads'));

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('ContactForm', () => {
  it('hands the message to the email app when the API is not configured', async () => {
    const { fixture, element } = await setup({
      config: { apiUrl: null, turnstileSiteKey: null, orbitApiUrl: null },
      audience: 'recruiter',
    });

    fill(element, 'contact-message', 'Are you available in March?');
    await fixture.whenStable();

    expect(element.querySelector('button[type="submit"]')).toBeNull();
    expect(element.textContent).toContain('Your email app will');
    expect(
      element
        .querySelector('.actions a[href^="mailto:"]')
        ?.getAttribute('href'),
    ).toBe(
      `mailto:ahmed.hrichi.web@gmail.com?subject=Opportunity%20for%20Ahmed%20Hrichi&body=${encodeURIComponent('Are you available in March?\n\n')}`,
    );
  });

  it('wakes the API as soon as the form is shown', async () => {
    const fetchFn = stubFetch(202);
    await setup();

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.test/health',
      expect.anything(),
    );
  });

  it('shows what is missing and sends nothing for an invalid lead', async () => {
    const fetchFn = stubFetch(202);
    const { fixture, element } = await setup();

    fill(element, 'contact-email', 'not-an-email');
    submit(element);
    await fixture.whenStable();

    expect(leadCalls(fetchFn)).toHaveLength(0);
    expect(element.querySelector('#contact-name-error')?.textContent).toContain(
      'Please enter your name.',
    );
    expect(
      element.querySelector('#contact-email-error')?.textContent,
    ).toContain('doesn’t look right');
  });

  it('sends a valid lead with its idempotency key and Turnstile token', async () => {
    const fetchFn = stubFetch(202);
    const { element } = await setup({ audience: 'recruiter' });

    fillValidLead(element);
    submit(element);

    await vi.waitFor(() =>
      expect(element.textContent).toContain('your message is on its way'),
    );
    const [, init] = leadCalls(fetchFn)[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'We need an Angular lead for Q1.',
      intent: 'role',
      audience: 'recruiter',
      turnstileToken: 'turnstile-token',
    });
    expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(body).not.toHaveProperty('website');
  });

  it('offers the same message by email when the API refuses it', async () => {
    stubFetch(400);
    const { element } = await setup();

    fillValidLead(element);
    submit(element);

    await vi.waitFor(() =>
      expect(element.textContent).toContain("couldn't be reached"),
    );
    const fallback = element
      .querySelector('.status a[href^="mailto:"]')
      ?.getAttribute('href');
    expect(fallback).toContain('subject=Project%20enquiry');
    expect(fallback).toContain(
      encodeURIComponent('We need an Angular lead for Q1.'),
    );
  });

  it('starts over with a fresh spam check after sending', async () => {
    stubFetch(202);
    const { element, widget } = await setup();

    fillValidLead(element);
    submit(element);
    await vi.waitFor(() =>
      expect(element.textContent).toContain('your message is on its way'),
    );
    element.querySelector<HTMLButtonElement>('.result button')?.click();

    await vi.waitFor(() =>
      expect(element.querySelector('form')?.hidden).toBe(false),
    );
    expect(
      element.querySelector<HTMLTextAreaElement>('#contact-message')?.value,
    ).toBe('');
    expect(
      element.querySelector<HTMLInputElement>('#contact-name')?.value,
    ).toBe('Ada Lovelace');
    expect(
      element.querySelector('#contact-message')?.getAttribute('aria-invalid'),
    ).toBe('false');
    expect(widget.reset).toHaveBeenCalled();
  });

  it('asks for a new spam check after a rejected token', async () => {
    stubFetch(403);
    const { element, widget } = await setup();

    fillValidLead(element);
    submit(element);

    await vi.waitFor(() =>
      expect(element.textContent).toContain('spam check failed'),
    );
    expect(widget.reset).toHaveBeenCalled();
  });
});
