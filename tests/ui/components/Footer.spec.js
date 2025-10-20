import { test, expect } from '@playwright/test';

test.describe('Footer Component E2E Tests', () => {
  test('users can view and navigate to the links in the footer.', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'All Rights Reserved ©' })).toBeVisible();

    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    const aboutLink = page.getByRole('link', { name: 'About' });
    await aboutLink.click();
    await expect(page).toHaveURL('/about');

    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
    const contactLink = page.getByRole('link', { name: 'Contact' });
    await contactLink.click();
    await expect(page).toHaveURL('/contact');

    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    const privacyPolicyLink = page.getByRole('link', { name: 'Privacy Policy' });
    await privacyPolicyLink.click();
    await expect(page).toHaveURL('/policy');
  });
});