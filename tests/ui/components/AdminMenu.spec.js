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

test.describe('Admin Menu Component', () => {
  test('should display all admin menu options', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 4, name: 'Admin Panel' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Category' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Product' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
  });
});

test.describe('Admin Menu Navigation Links', () => {
  test('should navigate to Create Category page', async ({ page }) => {
    await page.getByRole('link', { name: 'Create Category' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/create-category/);
  });

  test('should navigate to Create Product page', async ({ page }) => {
    await page.getByRole('link', { name: 'Create Product' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/create-product/);
  });

  test('should navigate to Products page', async ({ page }) => {
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);
  });

  test('should navigate to Orders page', async ({ page }) => {
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/orders/);
  });
});