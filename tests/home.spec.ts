import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText(/Welcome|Hello/i);
});
