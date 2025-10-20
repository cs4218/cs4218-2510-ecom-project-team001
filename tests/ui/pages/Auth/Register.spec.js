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

test.describe('E2E Registration and Login Flow', () => {
  test('should register a new user and login successfully', async ({ page }) => {
    // Use a unique email for each test run to avoid errors where the email is already registered
    const uniqueEmail = `user${Date.now()}@example.com`;

    // Registration
    await page.getByPlaceholder('Enter Your Name').fill('E2E Test User');
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page.getByText('Register Successfully, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('E2E Registration, Login, and Forgot Password Flow', () => {
  test('should register, login, reset password, and login with new password successfully', async ({ page }) => {
    // Use a unique email for each test run to avoid errors where the email is already registered
    const uniqueEmail = `user${Date.now()}@example.com`;

    // Registration
    await page.getByPlaceholder('Enter Your Name').fill('Full Cycle Test User');
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page.getByText('Register Successfully, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);

    // Logout
    await page.getByRole('button', { name: 'Full Cycle Test User' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);

    // Forgot Password
    await page.getByRole('button', { name: /forgot password/i }).click();
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('What is your favorite sport?').fill('Football');
    await page.getByPlaceholder('Enter Your New Password').fill('newpassword123');
    await page.getByPlaceholder('Confirm Your New Password').fill('newpassword123');
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page.getByText('Password reset successful, please login')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // Login with new password
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill('newpassword123');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/$/);
  });
});