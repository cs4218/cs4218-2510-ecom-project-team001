/* 
  MongoDB MUST BE seeded with sample given in Canvas to pass the tests
  This E2E UI test tests:
  1. Category Products API Integration between Header and useCategory hook (categoryController)
  2. Cart Context Integration on Logout and Cart Badge Updates
  3. Auth Integration on Logout in Header and Conditional UI Rendering Based on Auth State

  Workflow tested:
  1. Logout flow
  2. Header navigation flow (categories, login, register, home)
*/ 

import { test as base, expect } from '@playwright/test';

export const testUser = base.extend({
    storageState: "tests/ui/.auth/user.json",
});

export const testAdmin = base.extend({
    storageState: "tests/ui/.auth/admin.json",
})

testUser.describe('Header Component E2E Tests', () => {
  
  testUser.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  testUser('user logged in - should display all navigation elements and search', async ({ page }) => {
    // Brand
    const brand = page.getByRole('navigation');
    await expect(brand).toBeVisible();
    await expect(page.getByRole('link', { name: '🛒 Virtual Vault' })).toBeVisible();

    // Navigation links navigation
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();
    const cartButton = page.getByRole('link', { name: 'Cart' });
    await cartButton.click()
    await expect(page).toHaveURL('/cart');

    // Search flow
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    
    const searchInput = page.getByRole('searchbox', { name: 'Search' });
    await searchInput.fill('laptop');
    await expect(searchInput).toHaveValue('laptop');
    const searchButton = page.getByRole('button', { name: 'Search' })
    await searchButton.click();
    await expect(page).toHaveURL('/search');

    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click() // Go back to home using brand
    await expect(page).toHaveURL('/'); 

    // User links navigation
    await expect(page.getByRole('button', { name: 'test@gmail.com' })).toBeVisible();
    const userButton = page.getByRole('button', { name: 'test@gmail.com' });
    await userButton.click();

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    const dashboardButton = page.getByRole('link', { name: 'Dashboard' });
    await dashboardButton.click();
    await expect(page).toHaveURL('/dashboard/user');

    await userButton.click();
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    const logoutButton = page.getByRole('link', { name: 'Logout' });
    await logoutButton.click();
    await expect(page).toHaveURL('/login'); 
  });

  testAdmin('admin logged in - should display all navigation elements and search', async ({ page }) => {
    // Brand
    const brand = page.getByRole('navigation');
    await expect(brand).toBeVisible();
    await expect(page.getByRole('link', { name: '🛒 Virtual Vault' })).toBeVisible();

    // Navigation links navigation
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();
    const cartButton = page.getByRole('link', { name: 'Cart' });
    await cartButton.click()
    await expect(page).toHaveURL('/cart');

    // Search flow
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    
    const searchInput = page.getByRole('searchbox', { name: 'Search' });
    await searchInput.fill('laptop');
    await expect(searchInput).toHaveValue('laptop');
    const searchButton = page.getByRole('button', { name: 'Search' })
    await searchButton.click();
    await expect(page).toHaveURL('/search');

    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click() // Go back to home using brand
    await expect(page).toHaveURL('/'); 

    // User links navigation
    await expect(page.getByRole('button', { name: 'Test' })).toBeVisible();
    const userButton = page.getByRole('button', { name: 'Test' });
    await userButton.click();

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    const dashboardButton = page.getByRole('link', { name: 'Dashboard' });
    await dashboardButton.click();
    await expect(page).toHaveURL('/dashboard/admin');

    await userButton.click();
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    const logoutButton = page.getByRole('link', { name: 'Logout' });
    await logoutButton.click();
    await expect(page).toHaveURL('/login'); 
  });

  testUser('should handle unauthenticated user flow', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('auth'));
    await page.reload();
    
    // Display Register and Login
    const registerLink = page.getByRole('link', { name: 'Register' });
    const loginLink = page.getByRole('link', { name: 'Login' });
    await expect(registerLink).toBeVisible();
    await expect(loginLink).toBeVisible();
    
    // Navigate to register
    await registerLink.click();
    await expect(page).toHaveURL('/register');
    await page.goBack();
    
    // Navigate to login
    await loginLink.click();
    await expect(page).toHaveURL('/login');
  });

  testUser('should handle complete logout flow', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' }
      ]));
    });
    await page.reload();
    
    // Perform logout
    await expect(page.getByRole('button', { name: 'Test' })).toBeVisible();
    const userButton = page.getByRole('button', { name: 'Test' });
    await userButton.click();
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    const logoutButton = page.getByRole('link', { name: 'Logout' });
    await logoutButton.click();
    
    // Verify localStorage cleared
    const auth = await page.evaluate(() => localStorage.getItem('auth'));
    const cart = await page.evaluate(() => localStorage.getItem('cart'));
    expect(auth).toBeNull();
    expect(cart).toBeNull();
    
    // Verify success toast
    const toast = page.getByText('Logout Successfully');
    await expect(toast).toBeVisible({ timeout: 3000 });
    
    // Verify redirect to login
    await expect(page).toHaveURL('/login');
  });

  testUser('should display and update cart badge', async ({ page }) => {
    // Empty cart shows zero
    await page.evaluate(() => localStorage.setItem('cart', JSON.stringify([])));
    await page.reload();
    let badge = page.locator('.ant-badge .ant-badge-count');
    await expect(badge).toHaveText('0');
    
    // Cart with items shows count
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ]));
    });
    await page.reload();
    badge = page.locator('.ant-badge .ant-badge-count');
    await expect(badge).toHaveText('3');
  });

  testUser('should display and navigate categories', async ({ page }) => {
    
    // Open categories dropdown
    const categoriesDropdown = page.getByRole('link', { name: 'Categories' });
    await categoriesDropdown.click();
    
    // Verify all categories and "All Categories" link
    await expect(page.getByRole('link', { name: 'All Categories' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Electronics' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clothing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Book' })).toBeVisible();
    
    // Navigate to specific category
    const electronicsLink = page.getByRole('link', { name: 'Electronics' });
    await electronicsLink.click();
    await expect(page).toHaveURL('/category/electronics');
    await page.goBack();

    await categoriesDropdown.click();
    const allCategoriesLink = page.getByRole('link', { name: 'All Categories' });
    await allCategoriesLink.click();
    await expect(page).toHaveURL('/categories');
  });
});