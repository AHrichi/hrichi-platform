import { expect, type Page, test } from '@playwright/test';

const apiUrl = 'https://api.example.test';

// Requests the service worker forwards bypass page.route, so the mocks need
// the page to talk to the network itself.
test.use({ serviceWorkers: 'block' });

/** A stand-in for Cloudflare's script: the check passes straight away. */
const fakeTurnstile = `
  window.turnstile = {
    render(container, options) {
      setTimeout(() => options.callback('e2e-token'));
      return 'widget-1';
    },
    reset() {},
    remove() {},
  };
`;

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET, POST',
};

/** Turns the form on and records what reaches the (mocked) API. */
async function enableForm(page: Page, leadsStatus = 202) {
  const leads: unknown[] = [];
  await page.route('**/site-config.json', (route) =>
    route.fulfill({ json: { apiUrl, turnstileSiteKey: 'e2e-site-key' } }),
  );
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: fakeTurnstile }),
  );
  await page.route(`${apiUrl}/**`, (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors });
    }
    if (request.url().endsWith('/leads')) {
      leads.push(request.postDataJSON());
      return route.fulfill({
        status: leadsStatus,
        headers: cors,
        json: { id: 'lead-1', status: 'accepted' },
      });
    }
    return route.fulfill({ headers: cors, json: { status: 'ok' } });
  });
  return leads;
}

test('hands the message to the email app when the form is not configured', async ({
  page,
}) => {
  await page.route('**/site-config.json', (route) =>
    route.fulfill({ json: { apiUrl: null, turnstileSiteKey: null } }),
  );
  await page.goto('/contact');

  await page.getByLabel('Message').fill('Are you available in March?');

  await expect(
    page.getByRole('link', { name: 'Continue in your email app' }),
  ).toHaveAttribute(
    'href',
    /^mailto:ahmed\.hrichi\.web@gmail\.com\?subject=.+&body=Are%20you%20available%20in%20March%3F/,
  );
});

test('sends a message through the contact form', async ({ page }) => {
  const leads = await enableForm(page);
  await page.goto('/contact?for=client');

  await page.getByLabel('Your name').fill('Ada Lovelace');
  await page.getByLabel('Your email').fill('ada@example.com');
  await page.getByLabel('Message').fill('We need an Angular lead for Q1.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(
    page.getByRole('heading', { name: 'Thanks, your message is on its way' }),
  ).toBeVisible();
  expect(leads).toEqual([
    expect.objectContaining({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      intent: 'project',
      audience: 'client',
      turnstileToken: 'e2e-token',
    }),
  ]);
});

test('keeps the message and offers email when the API refuses it', async ({
  page,
}) => {
  await enableForm(page, 400);
  await page.goto('/contact');

  await page.getByLabel('Your name').fill('Ada Lovelace');
  await page.getByLabel('Your email').fill('ada@example.com');
  await page.getByLabel('Message').fill('We need an Angular lead for Q1.');
  await page.getByRole('button', { name: 'Send message' }).click();

  const fallback = page.getByRole('link', {
    name: 'Send the same message by email',
  });
  await expect(fallback).toHaveAttribute(
    'href',
    /body=We%20need%20an%20Angular%20lead%20for%20Q1\./,
  );
  await expect(page.getByLabel('Message')).toHaveValue(
    'We need an Angular lead for Q1.',
  );
});
