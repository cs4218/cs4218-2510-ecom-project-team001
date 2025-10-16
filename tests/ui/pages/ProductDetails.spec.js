/* 
  MongoDB MUST BE seeded with sample given in Canvas to pass the tests
  This E2E UI test tests:
  1. Shopping Cart Integration between ProductDetails and Cart context
  2. Product Data Integration between ProductDetails and getProductController (+ productPhotoController)
  3. Related Products API Integration between ProductDetails and realtedProductController
*/ 
import { test, expect } from '@playwright/test';

test.describe('ProductDetails Page', () => {
  const testProductSlug = 'the-law-of-contract-in-singapore';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/product/${testProductSlug}`);
    // Clear local storage before each test
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should display product details and should add item to the cart', async ({ page }) => {
    
    // Wait for product details to load
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();

    // Check product information is displayed
    await expect(page.getByRole('heading', { name: 'Name : The Law of Contract in' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Description : A bestselling book in Singapore' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Price :$54.99' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Category : Book' })).toBeVisible();

    // Check product image is displayed
    await expect(page.getByRole('img', { name: 'The Law of Contract in Singapore' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'The Law of Contract in Singapore' })).toHaveAttribute('alt');

    // Wait for page to load
    await expect(page.getByRole('button', { name: 'ADD TO CART' })).toBeVisible();

    // Check initial count of cart to be zero
    await expect(page.getByRole('listitem').filter({ hasText: 'Cart0' })).toBeVisible();

    await page.getByRole('button', { name: 'ADD TO CART' }).click();

    // Verify toast notification appears
    await expect(page.getByText('Item Added to cart')).toBeVisible({ timeout: 5000 });

    // Verify item is in localStorage
    const cartItems = await page.evaluate(() => {
      const cart = window.localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    });
    expect(cartItems.length).toBeGreaterThan(0);

    // Check whether cart in Header is updated
    await expect(page.getByRole('listitem').filter({ hasText: 'Cart1' })).toBeVisible();
  });

  test('should display similar products', async ({ page }) => {

    // Wait for similar products section
    await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible();
    
    // Check if first product card exists
    await expect(page.locator('div.card').filter({ hasText: /^Textbook\$79\.99A comprehensive textbook\.\.\.More Details$/ })).toBeVisible();
    const firstSimilarCard = page.locator('div').filter({ hasText: /^Textbook\$79\.99A comprehensive textbook\.\.\.More Details$/ }).first();
    
    await expect(firstSimilarCard.getByRole('img', { name: 'Textbook' })).toBeVisible()
    await expect(firstSimilarCard.getByRole('heading', { name: 'Textbook' })).toBeVisible();
    await expect(firstSimilarCard.getByText('A comprehensive textbook...')).toBeVisible();
    await expect(firstSimilarCard.getByRole('button', { name: 'More Details' })).toBeVisible();
    await expect(firstSimilarCard.getByRole('heading', { name: '$79.99' })).toBeVisible();

    // Check if second product card
    await expect(page.locator('div.card').filter({ hasText: /^Novel\$14\.99A bestselling novel\.\.\.More Details$/ })).toBeVisible();
    const secondSimilarCard = page.locator('div').filter({ hasText: /^Novel\$14\.99A bestselling novel\.\.\.More Details$/ }).first();
    
    await expect(secondSimilarCard.getByRole('img', { name: 'Novel' })).toBeVisible()
    await expect(secondSimilarCard.getByRole('heading', { name: 'Novel' })).toBeVisible();
    await expect(secondSimilarCard.getByText('A bestselling novel...')).toBeVisible();
    await expect(secondSimilarCard.getByRole('button', { name: 'More Details' })).toBeVisible();
    await expect(secondSimilarCard.getByRole('heading', { name: '$14.99' })).toBeVisible();

  });

  test('should navigate to similar product details', async ({ page }) => {
    // Wait for similar products
    await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible();
    
    // Check if first product card exists
    await expect(page.locator('div.card').filter({ hasText: /^Textbook\$79\.99A comprehensive textbook\.\.\.More Details$/ })).toBeVisible();
    const firstSimilarCard = page.locator('div').filter({ hasText: /^Textbook\$79\.99A comprehensive textbook\.\.\.More Details$/ }).first();

    await expect(firstSimilarCard.getByRole('button', { name: 'More Details' })).toBeVisible();
    await firstSimilarCard.getByRole('button', { name: 'More Details' }).click();
    await page.waitForURL('/product/textbook');
  });

  test('should handle 404 for non-existent product', async ({ page }) => {
    await page.goto(`${baseURL}/product/non-existent-product-slug`);

    await page.waitForURL(/\/404/, { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/404/);
    
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });

  test('should add multiple items to cart', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'ADD TO CART' })).toBeVisible();
    // Add to cart multiple times
    const addToCartBtn = page.getByRole('button', { name: 'ADD TO CART' });
    
    await addToCartBtn.click();
    await page.waitForTimeout(500);
    
    await addToCartBtn.click();
    await page.waitForTimeout(500);
    
    await addToCartBtn.click();

    // Verify multiple items in localStorage
    const cartItems = await page.evaluate(() => {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    });
    expect(cartItems.length).toBe(3);
  });

// Empty similar products
  test('should handle EMPTY similar products section', async ({ page }) => {
    await page.goto("/product/nus-tshirt");

    // Wait for product
    await expect(page.getByRole('heading', { name: 'Name : NUS T-shirt' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible();

    // Wait for similar products section
    await page.waitForTimeout(500);
    await expect(page.getByText('No Similar Products found')).toBeVisible();
  });
});

