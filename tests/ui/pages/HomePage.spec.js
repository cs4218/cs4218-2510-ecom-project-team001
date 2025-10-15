import { test, expect } from "@playwright/test";

// Run tests in parallel to speed up execution
test.describe.configure({ mode: "parallel" });

test.describe("Home Page", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    })

    test('should load all products successfully', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
        await expect(page.getByRole('article', { name: 'Novel'})).toBeVisible();
        await expect(page.getByRole('article', { name: 'The Law of Contract in Singapore'})).toBeVisible();
        await expect(page.getByRole('article', { name: 'NUS T-shirt'})).toBeVisible();
        await expect(page.getByRole('article', { name: 'Smartphone'})).toBeVisible();
        await expect(page.getByRole('article', { name: 'Laptop'})).toBeVisible();
        const nextPage = page.getByRole('button', { name: 'Loadmore' });
        if (await nextPage.count()) {
            await nextPage.click();
            await expect(page.getByRole('article', { name: 'Textbook'})).toBeVisible();
        } else {
            await expect(page.getByRole('article', { name: 'Textbook'})).toBeVisible();
        }
    })

    test('should load all categories successfully', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Filter By Category' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Gadgets' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Book' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Clothing' })).toBeVisible();
    })

    test('should load all prices successfully', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Filter By Price' })).toBeVisible();
        await expect(page.getByRole('radio', { name: '$0 to 19.99' })).toBeVisible();
        await expect(page.getByRole('radio', { name: '$20 to 39.99' })).toBeVisible();
        await expect(page.getByRole('radio', { name: '$40 to 59.99' })).toBeVisible();
        await expect(page.getByRole('radio', { name: '$60 to 79.99' })).toBeVisible();
        await expect(page.getByRole('radio', { name: '$80 to 99.99' })).toBeVisible();
        await expect(page.getByRole('radio', { name: '$100 or more' })).toBeVisible();
    })

    test('should navigate to product details page when "More Details" is clicked', async ({ page }) => {
        await page.getByRole('button', { name: 'More Details', exact: true }).first().click();
        await expect(page).toHaveURL(/\/product\/.+/);
        await expect(page.getByText('Product Details')).toBeVisible();
    })

    test('should filter products by category', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Gadgets' }).check();
        await expect(page.getByRole('article', { name: 'Smartphone'})).toBeVisible();
        await expect(page.getByRole('article', { name: 'Laptop'})).toBeVisible();
        const list = page.locator('[aria-label="product-list"]');
        await expect(list.getByRole('article')).toHaveCount(2); 
    })

    test('should filter products by price', async ({ page }) => {
        await page.getByRole('radio', { name: '$0 to 19.99' }).check();
        await expect(page.getByRole('article', { name: 'Novel'})).toBeVisible();
        await expect(page.getByRole('article', { name: 'NUS T-shirt'})).toBeVisible();
        const list = page.locator('[aria-label="product-list"]');
        await expect(list.getByRole('article')).toHaveCount(2); 
    })

    test('should filter products by category and price', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Book' }).check();
        await page.getByRole('radio', { name: '$0 to 19.99' }).check();
        await expect(page.getByRole('article', { name: 'Novel'})).toBeVisible();
        const list = page.locator('[aria-label="product-list"]');
        await expect(list.getByRole('article')).toHaveCount(1); 
    })

    test('should reset filter when "RESET FILTERS" button is clicked', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Book' }).check();
        await page.getByRole('radio', { name: '$0 to 19.99' }).check();
        await expect(page.getByRole('article', { name: 'Novel'})).toBeVisible();
        const list = page.locator('[aria-label="product-list"]');
        await expect(list.getByRole('article')).toHaveCount(1);
        await page.getByRole('button', { name: 'RESET FILTERS' }).click();
        const newlist = page.locator('[aria-label="product-list"]');
        await expect(newlist.getByRole('article')).toHaveCount(6);
    })

    test('should add product to cart when "ADD TO CART" button is clicked', async ({ page }) => {
        await page.getByRole('button', { name: 'ADD TO CART', exact: true }).first().click();
        await expect(page.getByText('Item Added to cart')).toBeVisible();
        const badge = page.locator('a[href="/cart"] + sup.ant-badge-count');
        await expect(badge).toHaveText('1');

        // Verify product in cart and clean up
        await page.goto('/cart');
        const cartItems = page.locator('[aria-label="cart-list"]');
        await expect(cartItems.getByRole('img')).toHaveCount(1);
        await page.getByRole('button', { name: 'Remove' }).click();
    })
})