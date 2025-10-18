import { test as base, expect } from '@playwright/test';

// For normal user
export const testUser = base.extend({
    storageState: "tests/ui/.auth/user.json",
});

testUser.describe.configure({ mode: "parallel" });

testUser.beforeEach(async ({ page }) => {
    await page.goto("/");
})

/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. components/Form/SearchInput.js
2. context/search.js,
3. pages/Search.js components
=====================================================

*/

testUser.describe("Search Input", () => {

    testUser('should return correct search result for full keyword of a single valid product', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Search' }).click();
        await page.getByRole('searchbox', { name: 'Search' }).fill('Laptop');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'Found 1' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Laptop' })).toBeVisible();
        await expect(page.getByRole('img', { name: 'Laptop' })).toBeVisible();
    });

    testUser('should return correct search result for partial keyword of a single valid product', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Search' }).click();
        await page.getByRole('searchbox', { name: 'Search' }).fill('No');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'Found 1' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible();
        await expect(page.getByRole('img', { name: 'Novel' })).toBeVisible();
    });

    testUser('should return correct search result for partial keyword of multiple valid products', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Search' }).click();
        await page.getByRole('searchbox', { name: 'Search' }).fill('Best');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'Found 2' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible();
        await expect(page.getByRole('img', { name: 'Novel' })).toBeVisible();
        await expect(page.getByText('A bestselling novel...')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The Law of Contract in' })).toBeVisible();
        await expect(page.getByRole('img', { name: 'The Law of Contract in' })).toBeVisible();
        await expect(page.getByText('A bestselling book in')).toBeVisible();
    });

    testUser('should return no products found for invalid product keyword', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Search' }).click();
        await page.getByRole('searchbox', { name: 'Search' }).fill('Random');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'No Products Found' })).toBeVisible();
    });

    testUser('should maintain search context', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Search' }).click();
        await page.getByRole('searchbox', { name: 'Search' }).fill('Laptop');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'Found 1' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Laptop' })).toBeVisible();
        await expect(page.getByRole('img', { name: 'Laptop' })).toBeVisible();

        // go to a different component
        await page.getByRole('button', { name: 'Cart' }).click();

        // should still have the search context keyword
        await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('Laptop');
    });
});
