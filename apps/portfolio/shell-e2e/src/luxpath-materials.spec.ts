import { expect, test } from './support/test';

test.describe('LuxPath materials', () => {
  test('adds, edits and deletes a material of your own', async ({ page }) => {
    await page.goto('/apps/lighting/materials');
    await page.getByRole('button', { name: '+ Add a material' }).click();
    const form = page.getByRole('dialog');
    await form
      .getByRole('combobox', { name: 'Category' })
      .selectOption('electrical');
    await form.getByRole('textbox', { name: /^Name/ }).fill('Local fuse box');
    await form.getByRole('spinbutton', { name: /Unit price/ }).fill('12.5');
    await form.getByRole('button', { name: 'Add a material' }).click();

    const card = page.locator('article', { hasText: 'Local fuse box' });
    await expect(card).toContainText('Yours');
    await expect(card).toContainText('€12.50');

    await card.getByRole('button', { name: /Edit/ }).click();
    await form.getByRole('spinbutton', { name: /Unit price/ }).fill('15');
    await form.getByRole('button', { name: 'Save changes' }).click();
    await expect(card).toContainText('€15');

    // It's kept on the device.
    await page.reload();
    await expect(card).toContainText('€15');

    await card.getByRole('button', { name: /Delete/ }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(card).toHaveCount(0);
  });

  test('edits a catalogue price, then resets it', async ({ page }) => {
    await page.goto('/apps/lighting/materials');
    const card = page.locator('article', {
      hasText: 'Câble Torsadé BT 2 × 16',
    });
    await expect(card).toContainText('per metre');
    await card.getByRole('button', { name: /Edit/ }).click();
    await page
      .getByRole('dialog')
      .getByRole('spinbutton', { name: /Unit price/ })
      .fill('1.9');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(card).toContainText('Edited');
    await expect(card).toContainText('1.90');

    await card.getByRole('button', { name: /Reset/ }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Reset' })
      .click();
    await expect(card).not.toContainText('Edited');
    await expect(card).toContainText('1.40');
  });
});
