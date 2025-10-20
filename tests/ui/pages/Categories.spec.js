import { test, expect } from '@playwright/test';

test.describe('Categories Page', () => {
  const testCategoriesSlugs = ['electronics', 'book', 'clothing'];

  test.beforeEach(async ({ page }) => {
    await page.goto("/categories");
  })

  test('users can view all available categories on the categories page', async ({ page }) => {
    for (const slug of testCategoriesSlugs) {
      await expect(page.getByRole('link', { name: slug, exact: false })).toBeVisible();
    }
  });

  test('users can navigate to specific category page by clicking category link', async ({ page }) => {
    for (const slug of testCategoriesSlugs) {
      await page.getByRole('link', { name: slug, exact: false }).click();
      await expect(page).toHaveURL(`/category/${slug}`);
      await expect(page.getByRole('heading', { name: `Category - ${slug}`, exact: false })).toBeVisible();
      await page.goto("/categories");
    }
  });
});