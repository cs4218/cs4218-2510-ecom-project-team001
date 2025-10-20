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

  test('a regular user should login successfully and redirect to homepage', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('cs4218@test.com');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);
  });

  test('an admin user should login successfully and redirect to homepage and see admin dashboard', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('admin@admin.com');
    await page.getByPlaceholder('Enter Your Password').fill('admin');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('button', { name: 'MyAdmin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin/);
  });

  test('should navigate to forgot password page when clicking forgot password button', async ({ page }) => {
    await page.getByRole('button', { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('E2E login and forgot password flow', () => {
  test('a regular user should reset password and login with new password', async ({ page }) => {
    // Navigate to forgot password page
    await page.getByRole('button', { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);

    // Fill in forgot password form
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('What is your favorite sport?').fill('password is cs4218@test.com');
    await page.getByPlaceholder('Enter Your New Password').fill('cs4218@test.com');
    await page.getByPlaceholder('Confirm Your New Password').fill('cs4218@test.com');
    await page.getByRole('button', { name: /set new password/i }).click();


    await expect(page.getByText('Password reset successful, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // Login with new password
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('cs4218@test.com');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);
  });

  test('an admin user should reset password, login with new password and access admin dashboard', async ({ page }) => {
    // Navigate to forgot password page
    await page.getByRole('button', { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);

    // Fill in forgot password form
    await page.getByPlaceholder('Enter Your Email').fill('admin@admin.com');
    await page.getByPlaceholder('What is your favorite sport?').fill('Leetcoding');
    await page.getByPlaceholder('Enter Your New Password').fill('admin');
    await page.getByPlaceholder('Confirm Your New Password').fill('admin');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page.getByText('Password reset successful, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // Login with new password
    await page.getByPlaceholder('Enter Your Email').fill('admin@admin.com');
    await page.getByPlaceholder('Enter Your Password').fill('admin');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('button', { name: 'MyAdmin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin/);
  });
});

test.describe('Login and Logout Flow', () => {
  test('user should logout successfully and be redirected to login page', async ({ page }) => {
    // Login first
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('cs4218@test.com');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);

    // Logout
    await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('after logout, user should not access protected routes and be redirected to login page', async ({ page }) => {
    // Try to access a protected route
    await page.goto('http://localhost:3000/dashboard/user');

    await expect(page).toHaveURL(/\/login/);
  });

  test('after logout, admin user should not access admin dashboard and be redirected to login page', async ({ page }) => {
    // Login as admin first
    await page.getByPlaceholder('Enter Your Email').fill('admin@admin.com');
    await page.getByPlaceholder('Enter Your Password').fill('admin');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);

    // Logout
    await page.getByRole('button', { name: 'MyAdmin' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login/);

    // Try to access admin dashboard
    await page.goto('http://localhost:3000/dashboard/admin');

    await expect(page).toHaveURL(/\/login/);
  });
});