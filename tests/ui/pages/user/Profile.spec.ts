import { test as base, expect } from '@playwright/test';

// For normal user
export const testUser = base.extend({
    storageState: "tests/ui/.auth/user.json",
});


/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. controllers/authController.js (updateProfileController)
2. pages/user/Profile.js components
=====================================================

*/

testUser.beforeEach(async ({ page }) => {
    // go to the profile page
    await page.goto("/");
    await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Profile' }).click();
})

testUser('should return error if password length < 6', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.locator('div').filter({ hasText: 'Password is required and 6' }).nth(4)).toBeVisible();
});

testUser('should update profile if password length >= 6', async ({ page }) => {
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

testUser("should show and allow editing of all profile fields", async ({ page }) => {
  const nameBox = page.getByPlaceholder("Enter Your Name");
  const phoneBox = page.getByPlaceholder("Enter Your Phone");
  const addressBox = page.getByPlaceholder("Enter Your Address");

  // verify prefilled
  await expect(nameBox).toHaveValue(/.+/);
  await expect(phoneBox).toHaveValue(/.+/);
  await expect(addressBox).toHaveValue(/.+/);

  // update
  await nameBox.fill("E2E Tester");
  await phoneBox.fill("91234567");
  await addressBox.fill("NUS COM2 E2E Street");
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole("button", { name: /update/i }).click();
  await expect(page.locator('div').filter({ hasText: 'Profile Updated Successfully' }).nth(4)).toBeVisible()


  // temporary restore original state
  await nameBox.fill("CS 4218 Test Account");
  await phoneBox.fill("81234567");
  await addressBox.fill("1 Computing Drive");
  await page.getByRole("button", { name: /update/i }).click();
  await expect(page.locator('div').filter({ hasText: 'Profile Updated Successfully' }).nth(4)).toBeVisible()
});