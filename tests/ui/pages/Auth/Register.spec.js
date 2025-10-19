import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/register');
});

test.describe('Register Page UI Tests', () => {
  test('should display all required input fields and register button', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter Your Name')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Phone')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Address')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your DOB')).toBeVisible();
    await expect(page.getByPlaceholder('What is Your Favorite sports')).toBeVisible();
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible();
  });

  test('should allow user to fill in the registration form', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill('testuser@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
  });

  test('should show error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/register/);

    const isValid = await page.$eval('input[placeholder="Enter Your Name"]', el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill('invalidemail');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/register/);

    const isValid = await page.$eval('input[placeholder="Enter Your Email "]', el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should show error toast for invalid phone number', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill('testuser@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('invalidphone');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText('Please enter a valid phone number.')).toBeVisible();
  });

  test('should show error toast for future DOB', async ({ page }) => {
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    const futureDate = new Date(Date.now() + oneWeekInMs).toISOString().split('T')[0];
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill('testuser@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill(futureDate);
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText('Date of birth cannot be a future date.')).toBeVisible();
  });

  test('should show error toast when trying to register with an already registered email', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText('Something went wrong')).toBeVisible();
  });

  test('should register successfully and redirect to login', async ({ page }) => {
    // Use a unique email for each test run to avoid errors where the email is already registered
    const uniqueEmail = `user${Date.now()}@example.com`;
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page.getByText('Register Successfully, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

// TODO: Add tests for E2E registration flow with API integration,
// including mocking backend responses for success and failure cases

// TODO: Add tests for E2E registration and login flow to ensure full auth cycle works as expected
// including verifying that after registration, user can login successfully

// TODO: Add tests for E2E registration, login, and forgot password flow to ensure complete auth lifecycle
// including verifying that after password reset, user can login with new password