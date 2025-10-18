import { test as base, expect } from '@playwright/test';

// For normal user
export const testUser = base.extend({
    storageState: "tests/ui/.auth/user.json",
});


/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. pages/user/Orders.js
2. controllers/authController.js (getOrdersController)
=====================================================

*/
testUser.beforeEach(async ({ page }) => {
  // go to the profile page
  await page.goto("/");
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
})


testUser("should display the Orders page header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
  });

testUser("should display at least one order in the table when orders exist", async ({ page }) => {
    // Wait for table to render
    await page.waitForSelector("table");

    // Check that the first row exists and has expected columns
    const headers = ["#", "Status", "Buyer", "date", "Payment", "Quantity"];
    for (const header of headers) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }

    // Check at least one order row
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    // Ensure at least one valid status cell is populated
    const statusText = await firstRow.locator("td").nth(1).textContent();
    expect(statusText?.trim().length).toBeGreaterThan(0);
  });

  testUser("should show product details within each order", async ({ page }) => {
    await page.waitForSelector(".card");

    const firstCard = page.locator(".card").first();

    // Validate product details
    await expect(firstCard.locator("img")).toBeVisible();
    await expect(firstCard.locator("p").nth(0)).toBeVisible(); // Product name
    await expect(firstCard.locator("p").nth(1)).toBeVisible(); // Product description
    await expect(firstCard.locator("p").nth(2)).toHaveText(/Price :/); // Price label
  });

  testUser("should display order product count and payment status", async ({ page }) => {
    await page.waitForSelector("tbody tr");

    const firstRow = page.locator("tbody tr").first();
    const paymentCell = firstRow.locator("td").nth(4);
    const quantityCell = firstRow.locator("td").nth(5);

    // Ensure payment status is either "Success" or "Failed"
    const paymentText = await paymentCell.textContent();
    expect(["Success", "Failed"]).toContain(paymentText?.trim());

    // Quantity cell should be numeric
    const qtyText = await quantityCell.textContent();
    expect(Number.isNaN(Number(qtyText))).toBe(false);
  });