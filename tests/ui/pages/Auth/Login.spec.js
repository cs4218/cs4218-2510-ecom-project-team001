import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
});

test.describe('Login Page UI Tests', () => {
  test('should display all required input fields and login button', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should allow user to fill in the login form', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('cs4218@test.com');
  });

  test('should show error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/login/);

    const isValid = await page.$eval('input[placeholder="Enter Your Email "]', el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('invalidemail');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/login/);

    const isValid = await page.$eval('input[placeholder="Enter Your Email "]', el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should show error toast for non-existent user', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('nonexistent@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Something went wrong')).toBeVisible();
  });

  test('should show error toast for incorrect credentials', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Something went wrong')).toBeVisible();
  });

  test('should login successfully and redirect to homepage', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('cs4218@test.com');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);
  });

  test('should navigate to forgot password page when clicking forgot password button', async ({ page }) => {
    await page.getByRole('button', { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

// TODO: Add tests for E2E login flow with API integration,
// including mocking backend responses for success and failure cases

// TODO: Add tests for E2E login and forgot password flow to ensure full auth cycle works as expected
// including verifying that after password reset, user can login with new password