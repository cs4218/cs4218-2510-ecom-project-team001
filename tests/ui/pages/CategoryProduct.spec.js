/* 
  MongoDB MUST BE seeded with sample given in Canvas to pass the tests
  This E2E UI test tests:
  1. Category Products API Integration between CategoryProduct and productCategoryController
  4. Error handling with 404 page
*/ 
import { test, expect } from '@playwright/test';

test.describe('CategoryProduct Page', () => {
  const testCategorySlug = 'electronics';
  const testCategoriesSlugs = ['electronics', 'book', 'clothing'];

  test.beforeEach(async ({ page }) => {
    await page.goto("/categories");
  })

  test('should correctly load all categories', async ({ page }) => {
    for (const slug of testCategoriesSlugs) {
      await expect(page.getByRole('link', { name: slug, exact: false })).toBeVisible();
    }
  });

  test('should navigate to category page on category click', async ({ page }) => {
    for (const slug of testCategoriesSlugs) {
      await page.getByRole('link', { name: slug, exact: false }).click();
      await expect(page).toHaveURL(`/category/${slug}`);
      await expect(page.getByRole('heading', { name: `Category - ${slug}`, exact: false })).toBeVisible();
      await page.goto("/categories");
    }
  });

  test('should display products of a category', async ({ page }) => {
    await page.goto(`/category/${testCategorySlug}`);

    await expect(page.getByRole('heading', { name: 'Category - Electronics' })).toBeVisible();
    await expect(page.getByText('2 result found')).toBeVisible();

    // Check if products are displayed for the selected category
    await expect(page.locator('div.card').filter({ hasText: /^Laptop\$1,499\.99A powerful laptopMore Details$/ })).toBeVisible();
    const laptopProductCard = page.locator('div').filter({ hasText: /^Laptop\$1,499\.99A powerful laptopMore Details$/ });

    await expect(laptopProductCard.getByRole('heading', { name: 'Laptop' })).toBeVisible();
    await expect(laptopProductCard.getByRole('heading', { name: '$1,499.99' })).toBeVisible();
    await expect(laptopProductCard.getByText('A powerful laptop')).toBeVisible();
    await expect(laptopProductCard.getByRole('button', { name: 'More Details' })).toBeVisible();
    await expect(laptopProductCard.getByRole('img', { name: 'Laptop' })).toBeVisible();
    
    await expect(page.locator('div.card').filter({ hasText: /^Smartphone\$999\.99A high-end smartphoneMore Details$/ })).toBeVisible();
    const smartphoneProductCard = page.locator('div').filter({ hasText: /^Smartphone\$999\.99A high-end smartphoneMore Details$/ });
    
    await expect(smartphoneProductCard.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
    await expect(smartphoneProductCard.getByRole('heading', { name: '$999.99' })).toBeVisible();
    await expect(smartphoneProductCard.getByText('A high-end smartphone')).toBeVisible();
    await expect(smartphoneProductCard.getByRole('button', { name: 'More Details' })).toBeVisible();
    await expect(smartphoneProductCard.getByRole('img', { name: 'Smartphone' })).toBeVisible();

    // Check if product card More Details button redirects to the correct product page
    await laptopProductCard.getByRole('button', { name: 'More Details' }).click();
    await expect(page).toHaveURL("/product/laptop");
  });

  test('should handle 404 for non-existent category', async ({ page }) => {
    await page.goto(`/category/non-existent-category-slug`);

    await page.waitForURL(/\/404/, { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/404/);
    
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
    
});

