import AxeBuilder from '@axe-core/playwright';
import { type Browser, expect, type Page, test } from '@playwright/test';
import { E2E_BOOTSTRAP } from './e2e-env';

/** A handle no earlier test used: the database lives for the whole run. */
const fresh = (prefix: string) =>
  `${prefix}_${Date.now().toString(36).slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

/** Chromium's virtual authenticator: a passkey without a real device. */
async function withPasskeys(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

/** Fails the test on any Content-Security-Policy violation. */
function watchCsp(page: Page): string[] {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().includes('Content Security Policy')
    ) {
      violations.push(message.text());
    }
  });
  return violations;
}

async function expectAccessible(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

async function signUp(page: Page, handle: string, birthYear = '2001') {
  await page.goto('/join');
  await page.getByLabel('Handle').fill(handle);
  await page.getByLabel('Your name').fill('Test player');
  await page.getByLabel('Birth year').fill(birthYear);
  await page.getByRole('button', { name: 'Create with a passkey' }).click();
  await expect(page).toHaveURL(/\/badge$/);
  await expect(page.getByText(`@${handle}`)).toBeVisible();
}

async function newPlayer(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await withPasskeys(page);
  return { context, page };
}

test.describe('BARQ', () => {
  test('a player signs up with a passkey and shows a badge', async ({
    page,
  }) => {
    const csp = watchCsp(page);
    await withPasskeys(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'One badge for every game' }),
    ).toBeVisible();
    await expectAccessible(page);

    const handle = fresh('nour');
    await signUp(page, handle);
    await expect(
      page.getByRole('img', { name: `Badge QR code of @${handle}` }),
    ).toBeVisible();
    await expect(page.getByTestId('badge-code')).toHaveText(/^\d{3} \d{3}$/);
    await expectAccessible(page);

    // Signing out and back in uses the same passkey.
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await expect(page).toHaveURL(/\/badge$/);
    await expect(page.getByText(`@${handle}`)).toBeVisible();
    expect(csp).toEqual([]);
  });

  test('under-13s are sent to a guardian', async ({ page }) => {
    await page.goto('/join');
    await page.getByLabel('Birth year').fill('2015');
    await expect(
      page.getByText('a parent or guardian creates the account'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create with a passkey' }),
    ).toBeDisabled();
  });

  test('Arabic reads right to left and stays accessible', async ({ page }) => {
    await withPasskeys(page);
    await signUp(page, fresh('amine'));
    await page.getByRole('radio', { name: 'العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'بطاقتي' })).toBeVisible();
    await expectAccessible(page);
  });

  test('staff check a player and a guest in, and the guest claims later', async ({
    browser,
    page,
  }) => {
    const csp = watchCsp(page);
    // The player, on their own phone.
    const player = await newPlayer(browser);
    const playerHandle = fresh('rayen');
    await signUp(player.page, playerHandle);

    // Staff sign up, then claim the venue once with the set-up code.
    await withPasskeys(page);
    await signUp(page, fresh('boss'), '1990');
    await page.goto('/staff');
    await page.getByLabel('Set-up code').fill(E2E_BOOTSTRAP);
    await page.getByRole('button', { name: 'Become manager' }).click();
    await expect(page.getByText('BARQ Warehouse')).toBeVisible();
    await expect(page.getByText('Size not measured yet')).toBeVisible();
    await page.getByRole('button', { name: 'Open a session' }).click();
    await expect(page.getByText('0 of 12 players')).toBeVisible();
    await expectAccessible(page);

    // No camera at this counter: the player reads out handle and code.
    const code = (await player.page.getByTestId('badge-code').textContent())
      ?.trim()
      .replace(' ', '');
    await page
      .getByLabel('Badge', { exact: true })
      .fill(`@${playerHandle} ${code}`);
    await page.getByLabel('Vest or blaster').fill('V-03');
    await page.getByRole('button', { name: 'Check in', exact: true }).click();
    // The sentence isolates the label for Arabic, so read the roster row.
    await expect(
      page.getByRole('listitem').filter({ hasText: `@${playerHandle}` }),
    ).toContainText('V-03 · B-03');
    await expect(page.getByText('1 of 12 players')).toBeVisible();

    // A guest: a nickname, a code to keep, and a blaster's label.
    await page.getByRole('radio', { name: 'A guest' }).click();
    await page.getByLabel('Guest’s nickname').fill('Rayen junior');
    await page.getByRole('button', { name: 'Create guest' }).click();
    await expect(page.getByTestId('guest-code')).toHaveText(
      /^\s*[0-9A-Z]{5}-[0-9A-Z]{5}\s*$/,
    );
    const guestCode = String(
      await page.getByTestId('guest-code').textContent(),
    ).trim();
    await page.getByLabel('Vest or blaster').fill('b4');
    await page.getByRole('button', { name: 'Check in', exact: true }).click();
    await expect(page.getByText('2 of 12 players')).toBeVisible();
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Rayen junior' }),
    ).toContainText('V-04');

    // The same vest twice is refused, in words.
    await page.getByRole('radio', { name: 'A player with a badge' }).click();
    await page
      .getByLabel('Badge', { exact: true })
      .fill(`@${playerHandle} ${code}`);
    await page.getByLabel('Vest or blaster').fill('V-04');
    await page.getByRole('button', { name: 'Check in', exact: true }).click();
    await expect(page.getByText('Already checked in.')).toBeVisible();

    // A claim waits until the guest has played…
    await player.page.goto('/claim');
    await player.page.getByLabel('Claim code').fill(guestCode);
    await player.page.getByRole('button', { name: 'Claim' }).click();
    await expect(
      player.page.getByText('This guest is still checked in.'),
    ).toBeVisible();

    // Closing the session releases everyone.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Close session' }).click();
    await expect(page.getByText('No session is open.')).toBeVisible();

    // …then the guest's games join an account.
    await player.page.getByRole('button', { name: 'Claim' }).click();
    await expect(
      player.page.getByText(
        'Done: the games of “Rayen junior” are on your profile now.',
      ),
    ).toBeVisible();
    expect(csp).toEqual([]);
    await player.context.close();
  });

  test('the app registers its service worker', async ({ page }) => {
    await page.goto('/');
    const scope = await page.evaluate(async () => {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 40_000)),
      ]);
      return registration?.scope ?? null;
    });
    expect(scope).toBe('http://localhost:4315/');
  });
});
