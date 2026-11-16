import type { Page } from '@playwright/test';
import { development, expect, test } from './support/test';

// The service worker would fetch for the page, out of page.route's sight.
test.use({ serviceWorkers: 'block' });

/** No AI backend is reachable: n8n and Ollama both answer 503 in the browser. */
async function aiDown(page: Page): Promise<void> {
  const down = (route: Parameters<Parameters<Page['route']>[1]>[0]) =>
    route.fulfill({ status: 503, body: 'down' });
  await page.route('http://127.0.0.1:5678/**', down);
  await page.route('http://127.0.0.1:11434/**', down);
  if (development.n8nUrl) await page.route(`${development.n8nUrl}/**`, down);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 20 warm days, then two days where Lea's replies turn short, slow and flat. */
function fixtureChat(): string {
  const lines: string[] = [];
  const base = Date.UTC(2026, 8, 1);
  for (let i = 0; i < 22; i++) {
    const d = new Date(base + i * 86_400_000);
    const ds = `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
    if (i < 20) {
      lines.push(
        `[${ds}, 19:00:00] Sam: Hey how was your day at work today?`,
        `[${ds}, 19:01:00] Lea: It was great, really happy with the meeting today`,
        `[${ds}, 19:02:00] Sam: Awesome, so glad to hear that`,
        `[${ds}, 19:03:00] Lea: Thanks! Super excited for the weekend with you`,
      );
    } else {
      lines.push(
        `[${ds}, 19:00:00] Sam: Hey how are you doing today?`,
        `[${ds}, 19:40:00] Lea: tired`,
        `[${ds}, 19:41:00] Sam: Want to talk?`,
        `[${ds}, 20:30:00] Lea: sad`,
        `[${ds}, 21:20:00] Lea: stressed`,
      );
    }
  }
  return lines.join('\n');
}

test('the Relationship tab shows check-ins and gates the cycle calendar on consent', async ({
  page,
}) => {
  await aiDown(page);
  // ChatPulse is hidden in the portfolio (app-visibility.ts), so this runs
  // against its standalone production build.
  await page.goto('http://localhost:4308/');

  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'WhatsApp Chat with Lea.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fixtureChat()),
    });

  await page.getByRole('tab', { name: /Relationship/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Moments worth checking in' }),
  ).toBeVisible();
  await expect(page.getByText('2026-09-21 → 2026-09-22')).toBeVisible();

  // No calendar until she has agreed: the button stays disabled.
  const setUp = page.getByRole('button', { name: 'Set up calendar' });
  await page.getByLabel('Her name').fill('Lea');
  await expect(setUp).toBeDisabled();
  await page
    .getByLabel(
      'She knows about this calendar and agreed to share these dates.',
    )
    .check();
  await setUp.click();

  await page.getByLabel('First day').fill('2026-09-12');
  await page.getByRole('button', { name: 'Add dates' }).click();
  await expect(page.getByText('Next period (estimate)')).toBeVisible();

  await page.getByRole('button', { name: 'Delete calendar' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(setUp).toBeVisible();
});
