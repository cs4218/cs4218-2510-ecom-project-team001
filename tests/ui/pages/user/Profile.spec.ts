import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    // logout of the admin account and enter the user account
    await page.goto("/dashboard/admin/]");
    await page.getByRole('button', { name: 'MYADMIN' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Profile' }).click();
})

test('should return error if password length < 6', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.locator('div').filter({ hasText: 'Password is required and 6' }).nth(4)).toBeVisible();
});

test('should update profile if password length >= 6', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123456');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.locator('div').filter({ hasText: 'Profile Updated Successfully' }).nth(4)).toBeVisible()

    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123456789abcdef');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.locator('div').filter({ hasText: 'Profile Updated Successfully' }).nth(4)).toBeVisible()


    // TODO: create separate test db (TEMPORARY CHANGE BACK PASSWORD HERE)
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.locator('div').filter({ hasText: 'Profile Updated Successfully' }).nth(4)).toBeVisible()
});