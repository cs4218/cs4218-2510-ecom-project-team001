import { test, expect } from '@playwright/test';

test.describe('Page not Found 404 E2E Tests', () => {
  test('should display 404 content and button to navigate back to home', async ({ page }) => {
    await page.goto('/not-existent-page');

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Oops ! Page Not Found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go Back' })).toBeVisible();
    const backButton = page.getByRole('link', { name: 'Go Back' });
    await backButton.click();
    await expect(page).toHaveURL('/'); 
  });
});