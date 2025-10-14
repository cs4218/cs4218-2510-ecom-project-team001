// import { test, expect } from '@playwright/test';

// test.beforeEach(async ({ page }) => {
//     await page.goto('http://localhost:3000/');
//     await page.getByRole('link', { name: 'Login' }).click();
//     await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
//     await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@gmail.com');
//     await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
//     await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin');
//     await page.getByRole('textbox', { name: 'Enter Your Password' }).press('Enter');
//     await page.getByRole('button', { name: 'LOGIN' }).click();
//     await page.getByRole('button', { name: 'admin' }).click();
//     await page.getByRole('link', { name: 'Dashboard' }).click();
//     await page.getByRole('link', { name: 'Profile' }).click();
// })

// test('should return error if password length < 6', async ({ page }) => {
//     await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
//     await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123');
//     await page.getByRole('button', { name: 'UPDATE' }).click();
//     await expect(page.locator('div').filter({ hasText: 'Password is required and 6' }).nth(4)).toBeVisible();
// });

// // test('should update profile if password length >= 6', async ({ page }) => {
// //     await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
// //     await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123456');
// //     await page.getByRole('button', { name: 'UPDATE' }).click();
// //     await expect(page.locator('div').filter({ hasText: 'Profile Updated Successfully' }).nth(4)).toBeVisible()
// // });