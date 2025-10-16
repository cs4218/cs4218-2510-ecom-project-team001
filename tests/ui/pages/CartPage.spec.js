import { test as base, expect } from "@playwright/test";


// For normal user
export const testUser = base.extend({
    storageState: "tests/ui/.auth/user.json",
});


// Run tests in parallel to speed up execution
testUser.describe.configure({ mode: "parallel" });

testUser.describe("Cart Page - not logged in", () => {
    testUser.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
        await page.getByRole('link', { name: 'Logout' }).click();
        await page.goto("/cart");
    })

    testUser('should show empty cart message', async ({ page }) => {
        await expect(page.getByText('Your Cart Is Empty')).toBeVisible();
        await expect(page.getByText('Hello Guest')).toBeVisible();
        await expect(page.getByText('Total: $0.00')).toBeVisible();3
    })

    testUser('should navigate to login page when "Please Login to checkout" is clicked', async ({ page }) => {
        await page.getByRole('button', { name: 'Please Login to checkout' }).click();
        await expect(page).toHaveURL(/\/login/);
    })
})

testUser.describe("Cart Page - logged in", () => {
    testUser.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.getByRole('button', { name: 'ADD TO CART', exact: true }).first().click();
        await page.getByRole('button', { name: 'ADD TO CART', exact: true }).nth(1).click();
        await page.getByRole('button', { name: 'ADD TO CART', exact: true }).nth(2).click();
        await page.goto("/cart");
    }) 

    testUser('should correctly display cart items', async ({ page }) => {
        const cartItems = page.locator('[aria-label="cart-list"]');
        await expect(cartItems.getByRole('img')).toHaveCount(3);
    })

    testUser('should successfully remove item from cart', async ({ page }) => {
        await page.getByRole('button', { name: 'Remove' }).nth(2).click();
        const cartItems = page.locator('[aria-label="cart-list"]');
        await expect(cartItems.getByRole('img')).toHaveCount(2);
    })

    testUser('should successfully update address from cart page', async ({ page }) => {
        await page.getByRole('button', { name: 'Update Address' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('new address');
        await page.getByRole('button', { name: 'UPDATE' }).click();
        await page.getByRole('link', { name: 'Cart' }).click();
        await expect(page.getByRole('heading', { name: 'new address' })).toBeVisible();

        //clean up
        await page.getByRole('button', { name: 'Update Address' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('1 Computing Drive');
        await page.getByRole('button', { name: 'UPDATE' }).click();
    })

    testUser('should successfully checkout using card', async ({ page }) => {
        await page.getByRole('button', { name: 'Paying with Card' }).click();
        const numberFrame = await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' });
        const expireDateFrame = await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' });
        const cvvFrame = await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' });
        await numberFrame.dblclick();
        await numberFrame.fill('4242424242424242');
        await expireDateFrame.dblclick();
        await expireDateFrame.fill('1030');
        await cvvFrame.dblclick();
        await cvvFrame.fill('123');
        await page.getByRole('button', { name: 'Make Payment' }).click();

        await expect(page.getByText('Payment Completed Successfully')).toBeVisible();
        await expect(page).toHaveURL(/\/dashboard\/user\/orders/);

        await page.goto("/cart");
        await expect(page.getByText('Your Cart Is Empty')).toBeVisible();
    })

    testUser('should handle error when paying with card', async ({ page }) => {
        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.getByRole('button', { name: 'Make Payment' }).click();

        // Card details are empty
        await expect(page.getByText('Please check your information')).toBeVisible();
    })
})