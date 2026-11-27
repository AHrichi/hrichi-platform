import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  badgeCode,
  badgeToken,
  FIRST_VENUE_SLUG,
  parseBadge,
  verifyBadge,
} from '@ah/products/lasertag/domain';
import { PreferencesStore } from '@ah/shared/state';
import { BarqSession } from '../state/barq-session';
import { BOOTSTRAP, setupBarq } from '../testing/fake-backend';
import { qrPath } from '../ui/qr-code';

/** Waits for async work and renders: zoneless, so stability is explicit. */
async function settle(harness: RouterTestingHarness, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
  }
}

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

/** Direction isolates around handles and labels, left out to compare text. */
const ISOLATES = new RegExp(
  `[${String.fromCharCode(0x2066)}${String.fromCharCode(0x2069)}]`,
  'g',
);

const text = (harness: RouterTestingHarness) =>
  (harness.routeNativeElement?.textContent ?? '')
    .replace(ISOLATES, '')
    .replace(/\s+/g, ' ');

afterEach(() => vi.unstubAllGlobals());

describe('sign-up', () => {
  it('creates a badge with a passkey and opens it', async () => {
    setupBarq();
    const harness = await RouterTestingHarness.create('/join');
    await settle(harness);
    const root = harness.routeNativeElement as HTMLElement;
    type(root.querySelector('#join-handle') as HTMLInputElement, 'nour_7');
    type(root.querySelector('#join-name') as HTMLInputElement, 'Nour');
    type(root.querySelector('#join-year') as HTMLInputElement, '2001');
    await settle(harness);
    (root.querySelector('button[type=submit]') as HTMLButtonElement).click();
    await settle(harness, 12);

    expect(TestBed.inject(Router).url).toBe('/badge');
    const session = TestBed.inject(BarqSession);
    expect(session.player()?.handle).toBe('nour_7');
    expect(text(harness)).toContain('@nour_7');
  });

  it('shows the rule problems while typing and blocks under-13s', async () => {
    setupBarq();
    const harness = await RouterTestingHarness.create('/join');
    await settle(harness);
    const root = harness.routeNativeElement as HTMLElement;
    type(root.querySelector('#join-handle') as HTMLInputElement, '7up');
    type(root.querySelector('#join-year') as HTMLInputElement, '2014');
    await settle(harness);
    expect(text(harness)).toContain('start with a letter');
    expect(text(harness)).toContain('a parent or guardian creates the account');
    const submit = root.querySelector(
      'button[type=submit]',
    ) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('says so when the passkey dialog is cancelled', async () => {
    const backend = setupBarq();
    backend.device.cancelNext = true;
    const harness = await RouterTestingHarness.create('/join');
    await settle(harness);
    const root = harness.routeNativeElement as HTMLElement;
    type(root.querySelector('#join-handle') as HTMLInputElement, 'nour_7');
    type(root.querySelector('#join-name') as HTMLInputElement, 'Nour');
    type(root.querySelector('#join-year') as HTMLInputElement, '2001');
    await settle(harness);
    (root.querySelector('button[type=submit]') as HTMLButtonElement).click();
    await settle(harness, 12);
    expect(text(harness)).toContain('Cancelled. Nothing was changed.');
    expect(TestBed.inject(BarqSession).player()).toBeNull();
  });
});

describe('the badge', () => {
  it('shows a QR the server accepts and a six-digit code', async () => {
    setupBarq();
    const session = TestBed.inject(BarqSession);
    await signUp(session, 'nour_7');
    const harness = await RouterTestingHarness.create('/badge');
    await settle(harness, 10);
    const root = harness.routeNativeElement as HTMLElement;
    const svg = root.querySelector('lt-qr-code svg');
    expect(svg?.getAttribute('aria-label')).toBe('Badge QR code of @nour_7');

    const stored = session.session();
    if (!stored) throw new Error('signed out');
    const code = await badgeCode(stored.badgeKey, stored.player.id, new Date());
    const shown = root.querySelector('[data-testid=badge-code]')?.textContent;
    expect(shown?.replace(/\s/g, '')).toBe(code);
    // The QR drawn is the badge for this step, one the server accepts.
    const token = await badgeToken(
      stored.badgeKey,
      stored.player.id,
      new Date(),
    );
    const drawn = root.querySelector('lt-qr-code path')?.getAttribute('d');
    expect(drawn).toBe(qrPath(token).d);
    const parts = parseBadge(token);
    expect(
      parts && (await verifyBadge(parts, stored.badgeKey, new Date())),
    ).toBe(true);
  });
});

describe('Arabic', () => {
  it('speaks Arabic right to left, with handles kept left to right', async () => {
    setupBarq();
    TestBed.inject(PreferencesStore).setLanguage('ar');
    await signUp(TestBed.inject(BarqSession), 'nour_7');
    const harness = await RouterTestingHarness.create('/badge');
    await settle(harness, 8);
    expect(document.documentElement.dir).toBe('rtl');
    expect(text(harness)).toContain('بطاقتي');
    const handle = harness.routeNativeElement?.querySelector('#badge-handle');
    expect(handle?.getAttribute('dir')).toBe('ltr');
    TestBed.inject(PreferencesStore).setLanguage('en');
  });
});

describe('the staff counter', () => {
  it('claims the venue, opens a session and checks a player in by code', async () => {
    const backend = setupBarq();
    const session = TestBed.inject(BarqSession);

    // A player signs up on their own phone (the same fake server).
    const player = await backend.service.signupStart({
      handle: 'rayen_9',
      displayName: 'Rayen',
      birthYear: 2000,
      language: 'fr',
      country: 'TN',
    });
    const signed = await backend.service.signupFinish({
      challengeId: player.challengeId,
      credential: {
        id: 'cred-rayen',
        rawId: 'cred-rayen',
        type: 'public-key',
        response: { challenge: backend.passkeys.lastChallenge() },
      },
    });

    // Staff sign up here, and claim the empty venue with the set-up code.
    await signUp(session, 'boss_1');
    const harness = await RouterTestingHarness.create('/staff');
    await settle(harness, 8);
    let root = harness.routeNativeElement as HTMLElement;
    type(root.querySelector('#staff-claim') as HTMLInputElement, BOOTSTRAP);
    (
      root.querySelector('form button[type=submit]') as HTMLButtonElement
    ).click();
    await settle(harness, 12);
    expect(text(harness)).toContain('BARQ Warehouse');
    expect(text(harness)).toContain('Size not measured yet');
    expect(text(harness)).toContain('12 of 12 vests ready');

    root = harness.routeNativeElement as HTMLElement;
    const open = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Open a session'),
    );
    open?.click();
    await settle(harness, 10);
    expect(text(harness)).toContain('0 of 12 players');

    const code = await badgeCode(signed.badgeKey, signed.player.id, new Date());
    root = harness.routeNativeElement as HTMLElement;
    const [badgeInput, gearInput] = [
      ...root.querySelectorAll('lt-scan-field input'),
    ] as HTMLInputElement[];
    type(badgeInput, `@rayen_9 ${code}`);
    type(gearInput, 'v7');
    await settle(harness);
    const checkIn = [...root.querySelectorAll('button[type=submit]')].find(
      (b) => b.textContent?.includes('Check in'),
    ) as HTMLButtonElement;
    checkIn.click();
    await settle(harness, 12);
    expect(text(harness)).toContain('@rayen_9 has V-07.');
    expect(text(harness)).toContain('1 of 12 players');
    expect(TestBed.inject(BarqSession).staffVenues()).toEqual([
      { venue: FIRST_VENUE_SLUG, role: 'manager' },
    ]);
  });
});

async function signUp(session: BarqSession, handle: string) {
  await session.signUp({
    handle,
    displayName: handle,
    birthYear: 1999,
    language: 'en',
    country: 'TN',
  });
}
