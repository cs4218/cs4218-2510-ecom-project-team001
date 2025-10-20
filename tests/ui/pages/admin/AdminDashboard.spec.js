import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('Enter Your Email').fill('admin@admin.com');
  await page.getByPlaceholder('Enter Your Password').fill('admin');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'MyAdmin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard\/admin/);
});

test.describe('Admin Dashboard Page UI Tests', () => {
  test('should display admin menu', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 4, name: 'Admin Panel' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Category' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Product' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
  });

  test('should display admin user information', async ({ page }) => {
    await expect(page.getByText('Admin Name : MyAdmin')).toBeVisible();
    await expect(page.getByText('Admin Email : admin@admin.com')).toBeVisible();
    await expect(page.getByText('Admin Contact : 81234567')).toBeVisible();
  });
});