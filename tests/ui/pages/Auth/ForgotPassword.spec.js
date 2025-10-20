import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/forgot-password');
});

test.describe('Forgot Password Page UI Tests', () => {
  test('should display all required input fields and reset button', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('What is your favorite sport?')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your New Password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm Your New Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /set new password/i })).toBeVisible();
  });

  test('should allow user to fill in the forgot password form', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('What is your favorite sport?').fill('password is cs4218@test.com');
    await page.getByPlaceholder('Enter Your New Password').fill('cs4218@test.com');
    await page.getByPlaceholder('Confirm Your New Password').fill('cs4218@test.com');
  });

  test('should show error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);

    const isValid = await page.$eval('input[placeholder="Enter Your Email"]', el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('invalidemail');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);

    const isValid = await page.$eval('input[placeholder="Enter Your Email"]', el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should show error toast for mismatched passwords', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('What is your favorite sport?').fill('password is cs4218@test.com');
    await page.getByPlaceholder('Enter Your New Password').fill('cs4218@test.com');
    await page.getByPlaceholder('Confirm Your New Password').fill('mismatchedpassword');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
  });

  test('should show error toast for non-existent user', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('nonexistent@test.com');
    await page.getByPlaceholder('What is your favorite sport?').fill('football');
    await page.getByPlaceholder('Enter Your New Password').fill('newpassword');
    await page.getByPlaceholder('Confirm Your New Password').fill('newpassword');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText('Error in resetting password')).toBeVisible();
  });

  test('should show error toast for incorrect security answer', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('What is your favorite sport?').fill('incorrect answer');
    await page.getByPlaceholder('Enter Your New Password').fill('newpassword');
    await page.getByPlaceholder('Confirm Your New Password').fill('newpassword');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText('Error in resetting password')).toBeVisible();
  });

  test('should reset password successfully and redirect to login', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('What is your favorite sport?').fill('password is cs4218@test.com');
    await page.getByPlaceholder('Enter Your New Password').fill('cs4218@test.com');
    await page.getByPlaceholder('Confirm Your New Password').fill('cs4218@test.com');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page.getByText('Password reset successful, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('E2E Forgot Password Flow', () => {
  test('should trim whitespace from email and answer inputs before submission', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('   cs4218@test.com   ');
    await page.getByPlaceholder('What is your favorite sport?').fill('   password is cs4218@test.com   ');
    await page.getByPlaceholder('Enter Your New Password').fill('cs4218@test.com');
    await page.getByPlaceholder('Confirm Your New Password').fill('cs4218@test.com');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page.getByText('Password reset successful, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});